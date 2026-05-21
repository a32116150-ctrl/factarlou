import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://factarlou.online";
const rootDir = path.join(__dirname, "..");
const postsDir = path.join(rootDir, "public/posts");

const staticPages = [
  { file: "index.html", priority: "1.0", changefreq: "weekly" },
  { file: "docs.html", priority: "0.9", changefreq: "weekly" },
  { file: "comparatif.html", priority: "0.9", changefreq: "weekly" },
  { file: "blog.html", priority: "0.8", changefreq: "weekly" },
  { file: "about.html", priority: "0.8", changefreq: "monthly" },
  { file: "showcase.html", priority: "0.8", changefreq: "monthly" },
  { file: "changelog.html", priority: "0.7", changefreq: "weekly" },
  { file: "privacy.html", priority: "0.6", changefreq: "yearly" },
  { file: "logiciel-facturation-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "facture-electronique-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "devis-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "declaration-tva-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "logiciel-caisse-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "calculateur-tva-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "logiciel-gestion-commerciale-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "facture-gratuite-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "simulateur-irpp-tunisie.html", priority: "0.8", changefreq: "weekly" },
  { file: "calculateur-cnss-tunisie.html", priority: "0.8", changefreq: "weekly" },
];

async function generateSitemap() {
  console.log("📡 Generating Sitemap...");

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach(page => {
    const loc = page.file === "index.html" ? `${BASE_URL}/` : `${BASE_URL}/${page.file}`;
    sitemap += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  });

  if (await fs.pathExists(postsDir)) {
    const files = await fs.readdir(postsDir);
    const htmlFiles = files.filter(f => f.endsWith(".html")).sort().reverse();
    htmlFiles.forEach(file => {
      sitemap += `  <url>\n    <loc>${BASE_URL}/posts/${file}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });
  }

  sitemap += `</urlset>`;

  await fs.writeFile(path.join(rootDir, "sitemap.xml"), sitemap);
  await fs.writeFile(path.join(rootDir, "public/sitemap.xml"), sitemap);
  console.log(`✅ sitemap.xml generated (${staticPages.length} static + blog posts)`);
}

generateSitemap();
