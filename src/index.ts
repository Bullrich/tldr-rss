import { setFailed, summary } from "@actions/core";

import { fetchNews, getRSSFeed } from "./news";
import { writeRssFeed } from "./rss";
import { News } from "./types";
import { logger } from "./util";

const RSS_BASE_URL = "https://tldr.tech/api/rss";

// Add rss feed to create a new one
const feeds: string[] = ["tech", "ai", "crypto"];

type NewsWithDate = News & { date: string };

const fetchFeeds = async (): Promise<NewsWithDate[]> => {
  const dateWithNews: NewsWithDate[] = [];
  for (const feedName of feeds) {
    const feed = `${RSS_BASE_URL}/${feedName}`;
    logger.debug(`Searching for feed for ${feed}`);
    const feedNews: NewsWithDate[] = [];
    const rssNews = await getRSSFeed(feed);
    for (const item of rssNews.items) {
      if (item.link && item.isoDate) {
        logger.info(`Downloading news from ${item.link} for ${item.isoDate}`);
        const news = await fetchNews(item.link);
        logger.debug(JSON.stringify(news));
        for (const currentNews of news) {
          feedNews.push({ ...currentNews, date: item.isoDate });
        }
      }
    }
    await writeRssFeed(feedName, dateWithNews);

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
