import { writeFile } from "fs/promises";

import { logger } from "./util";

type Post = { title: string; date: string; content: string; link: string };

/**
 * Generates a minimal HTML page listing articles for AI consumption
 * @param feedName - Name of the feed (e.g., "tech")
 * @param posts - Array of posts to include
 * @param maxArticles - Maximum number of articles to include (default: 50)
 */
export const writeHtmlFeed = async (
  feedName: string,
  posts: Post[],
  maxArticles = 50,
): Promise<void> => {
  logger.info(`Creating HTML feed for ${feedName} 📄`);

  if (posts.length === 0) {
    throw new Error(`No posts found for ${feedName}`);
  }

  // Sort posts by date (most recent first)
  const sortedPosts = posts
    .sort(
      (first, second) =>
        new Date(second.date).getTime() - new Date(first.date).getTime(),
    )
    .slice(0, maxArticles);

  // Generate minimal, semantic HTML
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="TLDR ${feedName.toUpperCase()} news articles for AI consumption">
    <title>TLDR ${feedName.toUpperCase()} News Feed</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        article {
            margin-bottom: 2em;
            border-bottom: 1px solid #eee;
            padding-bottom: 1em;
        }
        article:last-child {
            border-bottom: none;
        }
        h1 {
            color: #333;
        }
        h2 {
            color: #0066cc;
            margin-top: 0;
        }
        time {
            color: #666;
            font-size: 0.9em;
        }
        p {
            color: #444;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <header>
        <h1>TLDR ${feedName.toUpperCase()} News Feed</h1>
        <p>Latest ${sortedPosts.length} articles from <a href="https://tldr.tech/">TLDR</a></p>
    </header>
    <main>
${sortedPosts
  .map(
    (post) => `        <article>
            <h2><a href="${escapeHtml(post.link)}">${escapeHtml(post.title)}</a></h2>
            <time datetime="${new Date(post.date).toISOString()}">${new Date(post.date).toISOString()}</time>
            <p>${escapeHtml(post.content)}</p>
        </article>`,
  )
  .join("\n")}
    </main>
    <footer>
        <p>Generated on ${new Date().toISOString()}</p>
    </footer>
</body>
</html>`;

  await writeFile(`./site/${feedName}.html`, htmlContent, "utf8");
};

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
