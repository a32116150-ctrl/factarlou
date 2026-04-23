import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, "../index.html");
const templatePath = path.join(__dirname, "../blog-template.html");
const postsDir = path.join(__dirname, "../public/posts");

async function fixPosts() {
  // 1. Get Parent Version from index.html
  const indexContent = await fs.readFile(indexPath, "utf-8");
  const versionMatch = indexContent.match(/🚀 Version (v?\d+\.\d+\.\d+)/);
  const currentVersion = versionMatch ? versionMatch[1] : "2.6.0";
  const cleanVersion = currentVersion.replace('v', '');
  console.log(`📡 Parent Version: ${cleanVersion}`);

  // 2. Load Template
  const template = await fs.readFile(templatePath, "utf-8");
  const files = await fs.readdir(postsDir);

  for (const file of files) {
    if (file.endsWith(".html")) {
      const filePath = path.join(postsDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Extract existing data
      const titleMatch = content.match(/<title>(.*?) — Factarlou<\/title>/) || content.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : "Blog Factarlou";
      
      const dateMatch = content.match(/<span><i data-lucide="calendar".*?><\/i> (.*?)<\/span>/) || content.match(/(\d+ .*? \d+)/);
      const date = dateMatch ? dateMatch[1] : "23 Avril 2026";
      
      const categoryMatch = content.match(/<span style="color: var\(--primary\); font-weight: 700;.*?">(.*?)<\/span>/);
      const category = categoryMatch ? categoryMatch[1] : "Fintech";

      const coverMatch = content.match(/<img src="(.*?)"/) || content.match(/url\((.*?)\)/);
      const cover = coverMatch ? coverMatch[1] : "https://loremflickr.com/1200/800/business";

      const frContentMatch = content.match(/<div class="post-content">([\s\S]*?)<\/div>/);
      const frContent = frContentMatch ? frContentMatch[1] : "Contenu...";

      // Build New HTML
      let newHtml = template
        .replace(/{{TITLE_FR}}/g, title)
        .replace(/{{TITLE_AR}}/g, "تحسين تمويلك مع Factarlou")
        .replace(/{{CATEGORY}}/g, category)
        .replace(/{{CATEGORY_AR}}/g, "فنتك")
        .replace(/{{DATE}}/g, date)
        .replace(/{{COVER_IMAGE}}/g, cover)
        .replace(/{{CONTENT_FR}}/g, frContent)
        .replace(/{{CONTENT_AR}}/g, "قريباً باللغة العربية")
        .replace(/{{VERSION}}/g, cleanVersion);

      await fs.writeFile(filePath, newHtml);
    }
  }
  console.log("✅ All articles updated with the latest Parent version!");
}

fixPosts();
