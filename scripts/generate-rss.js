import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://factarlou.online";
const rootDir = path.join(__dirname, "..");
const postsDir = path.join(rootDir, "public/posts");

function extractMeta(html, filename) {
  const titleMatch = html.match(/<title>([^<]+?) — Factarlou<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : "Article Factarlou";

  const categoryMatch = html.match(/<span style="color: var\(--primary\); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0\.9rem;">([^<]+)<\/span>/);
  const category = categoryMatch ? categoryMatch[1].trim() : "Fintech";

  const firstPMatch = html.match(/<p>([^<]{50,300})\./);
  const excerpt = firstPMatch ? firstPMatch[1].trim() + "." : "Article sur Factarlou.";

  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  const pubDate = dateMatch ? new Date(dateMatch[1]).toUTCString() : new Date().toUTCString();

  return { title, category, excerpt, pubDate };
}

async function generateRss() {
  console.log("📡 Generating RSS Feed...");

  let items = "";

  if (await fs.pathExists(postsDir)) {
    const files = await fs.readdir(postsDir);
    const htmlFiles = files.filter(f => f.endsWith(".html")).sort().reverse();

    for (const file of htmlFiles) {
      const content = await fs.readFile(path.join(postsDir, file), "utf-8");
      const { title, category, excerpt, pubDate } = extractMeta(content, file);
      const link = `${BASE_URL}/posts/${file}`;

      items += `    <item>\n`;
      items += `      <title>${escapeXml(title)}</title>\n`;
      items += `      <link>${link}</link>\n`;
      items += `      <guid isPermaLink="true">${link}</guid>\n`;
      items += `      <description>${escapeXml(excerpt)}</description>\n`;
      items += `      <category>${escapeXml(category)}</category>\n`;
      items += `      <pubDate>${pubDate}</pubDate>\n`;
      items += `    </item>\n`;
    }
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Factarlou — Blog</title>
    <link>${BASE_URL}/blog.html</link>
    <description>Actualités et analyses sur la Fintech, la fiscalité et la gestion d'entreprise en Tunisie.</description>
    <language>fr-TN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}  </channel>
</rss>`;

  await fs.writeFile(path.join(rootDir, "public/rss.xml"), rss);
  console.log(`✅ rss.xml generated with ${items.split("<item>").length - 1} posts`);
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

generateRss();
