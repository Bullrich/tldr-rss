import { setFailed, summary } from "@actions/core";

import { writeHtmlFeed } from "./html";
import { fetchNews, getRSSFeed } from "./news";
import { writeRssFeed } from "./rss";
import { News } from "./types";
import { logger } from "./util";

const RSS_BASE_URL = "https://tldr.tech/api/rss";

// Maximum number of days to fetch, configurable via environment variable
const MAX_DAYS = parseInt(process.env.MAX_DAYS || "10", 10);

// Add rss feed to create a new one
const feeds: string[] = [
  "tech",
  "ai",
  "crypto",
  "founders",
  "design",
  "devops",
  "data",
];

type NewsWithDate = News & { date: string };

const fetchFeeds = async (): Promise<NewsWithDate[]> => {
  const dateWithNews: NewsWithDate[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);

  logger.info(
    `Fetching news from the last ${MAX_DAYS} days (since ${cutoffDate.toISOString()})`,
  );

  for (const feedName of feeds) {
    const feed = `${RSS_BASE_URL}/${feedName}`;
    logger.debug(`Searching for feed for ${feed}`);
    const feedNews: NewsWithDate[] = [];
    const rssNews = await getRSSFeed(feed);

    // Filter items by date before processing
    const recentItems = rssNews.items.filter((item) => {
      if (!item.isoDate) return false;
      const itemDate = new Date(item.isoDate);
      return itemDate >= cutoffDate;
    });

    logger.info(
      `Found ${rssNews.items.length} total items, ${recentItems.length} within the last ${MAX_DAYS} days`,
    );

    for (const item of recentItems) {
      if (item.link && item.isoDate) {
        logger.info(`Downloading news from ${item.link} for ${item.isoDate}`);
        const news = await fetchNews(item.link);
        logger.debug(`Downloaded ${news.length} articles`);
        for (const currentNews of news) {
          logger.debug(JSON.stringify(currentNews));
          feedNews.push({ ...currentNews, date: item.isoDate });
        }
      }
    }

    await writeRssFeed(feedName, feedNews);

    // Generate HTML page for tech feed only
    if (feedName === "tech") {
      await writeHtmlFeed(feedName, feedNews);
    }

    dateWithNews.push(...feedNews);
  }

  logger.debug(`All news: ${JSON.stringify(dateWithNews)}`);

  await writeRssFeed("feed", dateWithNews);
  return dateWithNews;
};

const summarizeNews = async (news: NewsWithDate[]): Promise<void> => {
  let text = summary
    .addHeading(`RSS news for ${new Date().toDateString()}`, 1)
    .addTable([
      [{ data: "Source", header: true }],
      ...feeds.map((feed) => [`<a href=${feed}>${feed}</a>`]),
    ])
    .addEOL();
  for (const { title, content, date, link } of news) {
    text = text
      .addHeading(`<a href=${link}>${title}</a>`, 3)
      .addEOL()
      .addHeading(new Date(date).toDateString(), 5)
      .addEOL()
      .addQuote(content)
      .addEOL();
  }

  await text.write();
};

fetchFeeds().then(summarizeNews).catch(setFailed);
