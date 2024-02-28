import { writeFile } from "fs/promises";
import xml from "xml";

import { logger } from "./util";

type Post = { title: string; date: string; content: string; link: string };

function buildFeed(posts: Post[]) {
  const sortedPosts = posts.sort(
    (first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime(),
  );

  const feedItems = [];

  feedItems.push(
    ...sortedPosts.map((post) => {
      return {
        item: [
          { title: post.title },
          {
            pubDate: new Date(post.date as string).toUTCString(),
          },
          {
            guid: [{ _attr: { isPermaLink: true } }, post.link],
          },
          {
            description: {
              _cdata: post.content,
            },
          },
        ],
      };
    }),
  );

  return feedItems;
}

export const writeRssFeed = async (posts: Post[]): Promise<void> => {
  logger.info("Creating feed 📚");
  const feedObject = {
    rss: [
      {
        _attr: {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        },
      },
      {
        channel: [
          {
            "atom:link": {
              _attr: {
                // TODO: Change this
                href: "YOUR-WEBSITE/feed.rss",
                rel: "self",
                type: "application/rss+xml",
              },
            },
          },
          {
            title: "TLDR RSS Feed",
          },
          {
            // TODO: Change this
            link: "YOUR-WEBSITE/",
          },
          { description: "TLDR RSS Feed" },
          { language: "en-US" },
          {
            image: [
              {
                url: "https://tldr.tech/tldrsquare.png",
                title: "TLDR RSS Feed",
                link: "https://tldr.tech",
              },
            ],
          },
          // todo: add the feed items here
          ...buildFeed(posts),
        ],
      },
    ],
  };

  const feed = '<?xml version="1.0" encoding="UTF-8"?>' + xml(feedObject);

  await writeFile("./site/feed.rss", feed, "utf8");
};
