import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_KEY && !GROQ_KEY) {
  console.error("Please set at least one API key (GEMINI_API_KEY or GROQ_API_KEY)");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;

async function generatePost(retryCount = 0, useFallback = false) {
  const date = DateTime.now().setLocale('fr').toFormat('dd MMMM yyyy');
  const slugDate = DateTime.now().toFormat('yyyy-MM-dd');
  
  const prompt = `
    Write a professional, deep-dive blog post for a Tunisian startup called "Factarlou" (an offline-first billing ERP).
    Topic: Entrepreneurship, finance, or taxation in Tunisia. 
    Examples: 
    - "Comment optimiser sa déclaration fiscale en Tunisie en 2026"
    - "Le guide complet du portail TEJ pour les PME"
    - "Pourquoi choisir un ERP local-first pour votre startup tunisienne"
    
    The response MUST be in JSON format with the following keys:
    - title_fr: String (High-impact headline)
    - title_ar: String (Arabic translation)
    - category_fr: String (e.g. "Conseils Fiscaux", "Entrepreneuriat")
    - category_ar: String
    - excerpt_fr: String (2 sentences max)
    - content_fr: HTML string (Include multiple h2, h3, p, ul, li. Make it at least 600 words. DO NOT use H1.)
    - content_ar: HTML string (Arabic version - fully localized. DO NOT use H1.)
    - unsplash_keyword: String (A single keyword in English to fetch a related image, e.g. "finance", "office", "accounting")
    
    Make the content authoritative, expert, and naturally recommend Factarlou.
  `;

  try {
    let data;
    if (!useFallback && GEMINI_KEY) {
      console.log("Attempting generation with Gemini...");
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(jsonStr);
    } else if (groq) {
      console.log("Using Groq Fallback (Llama 3)...");
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt + "\nRespond ONLY with JSON." }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      data = JSON.parse(chatCompletion.choices[0].message.content);
    } else {
      throw new Error("No available AI service to handle fallback.");
    }

    const coverImage = `https://images.unsplash.com/photo-1454165833762-02c4a4c1786c?auto=format&fit=crop&q=80&w=1200&q=${data.unsplash_keyword}`;
    const slug = `${slugDate}-${data.title_fr.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const postFileName = `${slug}.html`;
    const postFilePath = path.join(__dirname, "../public/posts", postFileName);

    let template = await fs.readFile(path.join(__dirname, "../blog-template.html"), "utf-8");

    let postHtml = template
      .replace(/{{TITLE}}/g, data.title_fr)
      .replace(/{{TITLE_FR}}/g, data.title_fr)
      .replace(/{{TITLE_AR}}/g, data.title_ar)
      .replace(/{{CATEGORY}}/g, data.category_fr)
      .replace(/{{CATEGORY_AR}}/g, data.category_ar)
      .replace(/{{EXCERPT}}/g, data.excerpt_fr)
      .replace(/{{DATE}}/g, date)
      .replace(/{{COVER_IMAGE}}/g, coverImage)
      .replace(/{{CONTENT_FR}}/g, data.content_fr)
      .replace(/{{CONTENT_AR}}/g, data.content_ar);

    await fs.ensureDir(path.dirname(postFilePath));
    await fs.writeFile(postFilePath, postHtml);
    console.log(`Post generated: ${postFileName}`);

    await updateBlogListing(data, postFileName, date, coverImage);
    await updateSitemap(postFileName);
    await updateSearchIndex(data, postFileName);

  } catch (error) {
    if (error.status === 429 && retryCount < 5 && !useFallback) {
      console.log(`Gemini rate limited. Retrying in 30 seconds... (Attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 30000));
      return generatePost(retryCount + 1, false);
    } else if (!useFallback && groq) {
      console.log("Gemini failed or rate limited. Switching to Groq Fallback...");
      return generatePost(0, true);
    }
    console.error("Critical Error generating post:", error);
    process.exit(1);
  }
}

async function updateSearchIndex(data, fileName) {
  const indexPath = path.join(__dirname, "../public/search-index.json");
  let index = [];
  try {
    if (await fs.exists(indexPath)) index = await fs.readJson(indexPath);
  } catch (e) { index = []; }
  index.unshift({
    title: data.title_fr,
    title_ar: data.title_ar,
    excerpt: data.excerpt_fr,
    url: `/posts/${fileName}`,
    type: 'blog'
  });
  await fs.writeJson(indexPath, index.slice(0, 100), { spaces: 2 });
}

async function updateBlogListing(data, fileName, date, coverImage) {
  const blogPath = path.join(__dirname, "../blog.html");
  let blogHtml = await fs.readFile(blogPath, "utf-8");
  const newCard = `
            <a href="/posts/${fileName}" class="post-card" data-reveal>
                <img src="${coverImage}" alt="${data.title_fr}" class="post-image">
                <div class="post-content">
                    <div class="post-meta">
                        <span><i data-lucide="calendar" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${date}</span>
                        <span><i data-lucide="tag" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${data.category_fr}</span>
                    </div>
                    <h2>${data.title_fr}</h2>
                    <p class="post-excerpt">${data.excerpt_fr}</p>
                </div>
                <div class="post-footer">
                    <span>Lire l'article</span>
                    <i data-lucide="arrow-right"></i>
                </div>
            </a>
  `;
  if (blogHtml.includes('id="no-posts"')) {
    blogHtml = blogHtml.replace(/<div class="empty-blog" id="no-posts">[\s\S]*?<\/div>/, newCard);
  } else {
    blogHtml = blogHtml.replace('<div class="blog-grid" id="posts-grid">', `<div class="blog-grid" id="posts-grid">\n${newCard}`);
  }
  await fs.writeFile(blogPath, blogHtml);
}

async function updateSitemap(fileName) {
  const sitemapPath = path.join(__dirname, "../public/sitemap.xml");
  let sitemap = await fs.readFile(sitemapPath, "utf-8");
  const newEntry = `  <url>
    <loc>https://factarlou.online/posts/${fileName}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n</urlset>`;
  sitemap = sitemap.replace('</urlset>', newEntry);
  await fs.writeFile(sitemapPath, sitemap);
}

generatePost();
