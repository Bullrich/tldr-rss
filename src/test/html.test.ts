import { readFile, unlink } from "fs/promises";

import { writeHtmlFeed } from "../html";

describe("HTML Feed Generation", () => {
  const testPosts = [
    {
      title: "Test Article 1",
      link: "https://example.com/1",
      content: "This is test content 1",
      date: new Date("2024-01-15T10:00:00Z").toISOString(),
    },
    {
      title: "Test Article 2",
      link: "https://example.com/2",
      content: "This is test content 2",
      date: new Date("2024-01-16T10:00:00Z").toISOString(),
    },
    {
      title: "Test Article 3",
      link: "https://example.com/3",
      content: "This is test content 3",
      date: new Date("2024-01-14T10:00:00Z").toISOString(),
    },
  ];

  afterEach(async () => {
    // Clean up test files
    try {
      await unlink("./site/test.html");
    } catch (error) {
      // File might not exist, ignore error
    }
  });

  it("should create an HTML file with articles", async () => {
    await writeHtmlFeed("test", testPosts);

    const content = await readFile("./site/test.html", "utf8");

    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain('<html lang="en">');
    expect(content).toContain("TLDR TEST News Feed");
  });

  it("should include all articles in the HTML", async () => {
    await writeHtmlFeed("test", testPosts);

    const content = await readFile("./site/test.html", "utf8");

    expect(content).toContain("Test Article 1");
    expect(content).toContain("Test Article 2");
    expect(content).toContain("Test Article 3");
    expect(content).toContain("https://example.com/1");
    expect(content).toContain("This is test content 1");
  });

  it("should sort articles by date (most recent first)", async () => {
    await writeHtmlFeed("test", testPosts);

    const content = await readFile("./site/test.html", "utf8");

    // Article 2 (2024-01-16) should appear before Article 1 (2024-01-15)
    const article2Index = content.indexOf("Test Article 2");
    const article1Index = content.indexOf("Test Article 1");
    const article3Index = content.indexOf("Test Article 3");

    expect(article2Index).toBeLessThan(article1Index);
    expect(article1Index).toBeLessThan(article3Index);
  });

  it("should include ISO 8601 dates", async () => {
    await writeHtmlFeed("test", testPosts);

    const content = await readFile("./site/test.html", "utf8");

    expect(content).toContain("2024-01-15T10:00:00.000Z");
    expect(content).toContain("2024-01-16T10:00:00.000Z");
    expect(content).toContain("2024-01-14T10:00:00.000Z");
  });

  it("should limit articles to maxArticles parameter", async () => {
    const manyPosts = Array.from({ length: 100 }, (_, i) => {
      return {
        title: `Article ${i}`,
        link: `https://example.com/${i}`,
        content: `Content ${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      };
    });

    await writeHtmlFeed("test", manyPosts, 10);

    const content = await readFile("./site/test.html", "utf8");

    // Should contain first 10 articles
    expect(content).toContain("Article 0");
    expect(content).toContain("Article 9");

    // Should not contain articles beyond limit
    expect(content).not.toContain("Article 10");
    expect(content).not.toContain("Article 99");
  });

  it("should escape HTML special characters", async () => {
    const postsWithHtml = [
      {
        title: "Article with <script>alert('XSS')</script>",
        link: "https://example.com/xss",
        content: "Content with & < > \" ' characters",
        date: new Date("2024-01-15T10:00:00Z").toISOString(),
      },
    ];

    await writeHtmlFeed("test", postsWithHtml);

    const content = await readFile("./site/test.html", "utf8");

    // Should escape dangerous characters
    expect(content).not.toContain("<script>");
    expect(content).toContain("&lt;script&gt;");
    expect(content).toContain("&amp;");
    expect(content).toContain("&quot;");
  });

  it("should throw error if no posts are provided", async () => {
    await expect(writeHtmlFeed("test", [])).rejects.toThrow(
      "No posts found for test",
    );
  });
});
