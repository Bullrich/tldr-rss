/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "axios";
import { JSDOM } from "jsdom";
import Parser from "rss-parser";

import { News } from "./types";
import { logger } from "./util";

export const getRSSFeed = async (feed: string) => {
  const parser = new Parser();
  logger.info(`Fetching feed for ${feed}`);
  return await parser.parseURL(feed);
};

export const fetchNews = async (url: string): Promise<News[]> => {
  logger.info(`Downloading site from ${url}`);
  try {
    const siteFetch = await axios.get(url);
    const site = new JSDOM(siteFetch.data as string);
    const doc = site.window.document;

    const news: News[] = [];

    // We get all the headers
    const headers = doc.querySelectorAll("h3");
    logger.info(`Found ${headers.length} headers. Parsing them`);
    for (const header of headers.values()) {
      const title = header.textContent;
      const link = header.parentElement?.getAttribute("href");
      const content =
        header.parentElement?.parentElement?.querySelector("div")?.textContent;
      if (!title || !link || !content) {
        logger.debug(
          `Skipping null elements: ${title ?? "title"} ${url} ${
            content ?? "content"
          }`,
        );
        continue;
      }

      news.push({ title, link, content });
    }

    return news;
  } catch (error) {
    logger.info(
      `Failed to fetch news from ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }
};
