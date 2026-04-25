import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://factarlou.online";
const rootDir = path.join(__dirname, "..");
const postsDir = path.join(rootDir, "public/posts");

async function generateSitemap() {
  console.log("📡 Generating Sitemap...");

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Add Static Pages
  const staticPages = ["index.html", "blog.html", "showcase.html", "about.html", "docs.html"];
  staticPages.forEach(page => {
    sitemap += `  <url>\n    <loc>${BASE_URL}/${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === 'index.html' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });

  // 2. Add All Blog Posts
  if (await fs.pathExists(postsDir)) {
    const files = await fs.readdir(postsDir);
    files.forEach(file => {
      if (file.endsWith(".html")) {
        sitemap += `  <url>\n    <loc>${BASE_URL}/posts/${file}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }
    });
  }

  sitemap += `</urlset>`;

  await fs.writeFile(path.join(rootDir, "sitemap.xml"), sitemap);
  console.log("✅ sitemap.xml generated successfully!");
}

generateSitemap();
