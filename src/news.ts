/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "axios";
import { JSDOM } from "jsdom";
import Parser from "rss-parser";

import { News } from "./types";
import { logger } from "./util";

export const getRSSFeed = async (
  feed: string,
): Promise<Parser.Output<Record<string, unknown>>> => {
  const parser = new Parser();
  logger.info(`Fetching feed for ${feed}`);

  const maxRetries = 6; // 6 retries + 1 initial attempt = 7 total attempts
  let attemptCount = 0;

  while (attemptCount <= maxRetries) {
    try {
      return await parser.parseURL(feed);
    } catch (error: unknown) {
      attemptCount++;

      // Check if this is a 429 error
      const errorWithResponse = error as {
        response?: { status?: number; headers?: Record<string, string> };
      };
      const is429Error = errorWithResponse?.response?.status === 429;

      if (!is429Error || attemptCount > maxRetries) {
        // If it's not a 429 error, or we've exhausted all retries, throw the error
        if (is429Error && attemptCount > maxRetries) {
          logger.warn(
            `Failed to fetch RSS feed for ${feed} after ${maxRetries + 1} attempts due to rate limiting`,
          );
        }
        throw error;
      }

      // Extract retry delay from Retry-After header or default to 30 seconds
      const retryAfter = errorWithResponse.response?.headers?.["retry-after"];
      const delaySeconds =
        retryAfter && !isNaN(parseInt(retryAfter, 10))
          ? parseInt(retryAfter, 10)
          : 30;
      const delayMs = delaySeconds * 1000;

      logger.warn(
        `Rate limited (429) for feed ${feed}. Retrying in ${delaySeconds} seconds (attempt ${attemptCount}/${maxRetries + 1})`,
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached, but TypeScript needs this to understand the function always returns or throws
  throw new Error("Unexpected end of retry loop");
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
