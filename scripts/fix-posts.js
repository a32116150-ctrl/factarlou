import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, "../blog-template.html");
const postsDir = path.join(__dirname, "../public/posts");

async function fixPosts() {
  const template = await fs.readFile(templatePath, "utf-8");
  const files = await fs.readdir(postsDir);

  for (const file of files) {
    if (file.endsWith(".html")) {
      console.log(`Fixing ${file}...`);
      const filePath = path.join(postsDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Extract data from the old file
      const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : "Blog Factarlou";
      
      const dateMatch = content.match(/<div style=".*?">(\d+ .*? \d+)<\/div>/) || content.match(/(\d+ .*? \d+)/);
      const date = dateMatch ? dateMatch[1] : "23 Avril 2026";
      
      const categoryMatch = content.match(/<span style=".*?">(.*?)<\/span>/);
      const category = categoryMatch ? categoryMatch[1] : "Fintech";

      const coverMatch = content.match(/<img src="(.*?)"/) || content.match(/url\((.*?)\)/);
      const cover = coverMatch ? coverMatch[1] : "https://loremflickr.com/1200/800/business";

      // Extract FR content blocks
      const frContentMatch = content.match(/<div class="post-content">([\s\S]*?)<\/div>/);
      const frContent = frContentMatch ? frContentMatch[1] : "Contenu en cours de chargement...";

      // Simple replacement into the new template
      let newHtml = template
        .replace(/{{TITLE_FR}}/g, title)
        .replace(/{{TITLE_AR}}/g, "تحسين تمويلك مع Factarlou")
        .replace(/{{CATEGORY}}/g, category)
        .replace(/{{CATEGORY_AR}}/g, "فنتك")
        .replace(/{{DATE}}/g, date)
        .replace(/{{COVER_IMAGE}}/g, cover)
        .replace(/{{CONTENT_FR}}/g, frContent)
        .replace(/{{CONTENT_AR}}/g, "قريباً باللغة العربية");

      await fs.writeFile(filePath, newHtml);
    }
  }
}

fixPosts();
