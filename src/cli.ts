import axios from "axios";
import { JSDOM } from "jsdom";
import Parser from "rss-parser";
import { writeRssFeed } from "./rss";

const rssFeed = "https://tldr.tech/api/rss/tech";

type News = { title: string; link: string; content: string };

const getRSSFeed = async () => {
  const parser = new Parser();
  console.log("Fetching feed for", rssFeed);
  return await parser.parseURL(rssFeed);
};

const fetchNews = async (url: string): Promise<News[]> => {
  console.log("Downloading site from", url);
  const content = await axios.get(url);
  const site = new JSDOM(content.data);
  const doc = site.window.document;

  const news: News[] = [];

  // We get all the headers
  const headers = doc.querySelectorAll("h3");
  console.log("Found %s headers. Parsing them", headers.length);
  for (const header of headers.values()) {
    const title = header.textContent;
    const link = header.parentElement?.getAttribute("href");
    const content =
      header.parentElement?.parentElement?.querySelector("div")?.textContent;
    if (!title || !link || !content) {
      console.log("Skipping null element", title, url, content);
      continue;
    }

    news.push({ title, link, content });
  }

  return news;
};

const run = async () => {
  const rssNews = await getRSSFeed();
  const link = "https://tldr.tech/tech/2024-02-05";
  const dateWithNews:  (News & {date:string})[] = [];
  for (const item of rssNews.items) {
    if (item.link && item.isoDate) {
      console.log("Downloading news from %s", item.isoDate, item.link);
      const news = await fetchNews(item.link);
      console.log(news);
      for (const currentNews of news) {
          dateWithNews.push({...currentNews, date:item.isoDate});
      }
      break;
    }
  }

  console.log("All news", dateWithNews);
  await writeRssFeed(dateWithNews)
};

run();
