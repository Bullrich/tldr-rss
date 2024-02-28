import { setFailed } from "@actions/core";

import { fetchNews, getRSSFeed } from "./news";
import { writeRssFeed } from "./rss";
import { News } from "./types";
import { logger } from "./util";

const feeds: string[] = [
  "https://tldr.tech/api/rss/tech",
  "https://tldr.tech/api/rss/ai",
  "https://tldr.tech/api/rss/crypto",
];

const fetchFeeds = async () => {
  const dateWithNews: (News & { date: string })[] = [];
  for (const feed of feeds) {
    logger.debug(`Searching for feed for ${feed}`);
    const rssNews = await getRSSFeed(feed);
    for (const item of rssNews.items) {
      if (item.link && item.isoDate) {
        logger.info(`Downloading news from ${item.link} for ${item.isoDate}`);
        const news = await fetchNews(item.link);
        logger.debug(JSON.stringify(news));
        for (const currentNews of news) {
          dateWithNews.push({ ...currentNews, date: item.isoDate });
        }
      }
    }
  }

  logger.debug(`All news: ${JSON.stringify(dateWithNews)}`);
  await writeRssFeed(dateWithNews);
};

fetchFeeds()
  .then(() => logger.info("Finished generating feed"))
  .catch(setFailed);
