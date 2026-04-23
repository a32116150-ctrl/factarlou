const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");
const { DateTime } = require("luxon");

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Please set GEMINI_API_KEY environment variable");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generatePost() {
  const date = DateTime.now().setLocale('fr').toFormat('dd MMMM yyyy');
  const slugDate = DateTime.now().toFormat('yyyy-MM-dd');
  
  const prompt = `
    Write a professional blog post for a Tunisian startup called "Factarlou" (an offline-first billing ERP).
    Topic: Entrepreneurship, finance, or taxation in Tunisia (e.g., new 2026 finance laws, how to start a PME, managing TVA, TEJ portal benefits).
    
    The response MUST be in JSON format with the following keys:
    - title_fr: String
    - title_ar: String
    - category_fr: String
    - category_ar: String
    - excerpt_fr: String
    - content_fr: HTML string (use h2, h3, p, ul, li - NO main h1)
    - content_ar: HTML string (Arabic version - use h2, h3, p, ul, li - NO main h1)
    
    Make the content high quality, helpful, and include a natural mention of Factarlou as a solution.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from potential markdown blocks
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);

    const slug = `${slugDate}-${data.title_fr.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const postFileName = `${slug}.html`;
    const postFilePath = path.join(__dirname, "../posts", postFileName);

    // Load template
    let template = await fs.readFile(path.join(__dirname, "../blog-template.html"), "utf-8");

    // Replace placeholders
    let postHtml = template
      .replace(/{{TITLE}}/g, data.title_fr)
      .replace(/{{TITLE_FR}}/g, data.title_fr)
      .replace(/{{TITLE_AR}}/g, data.title_ar)
      .replace(/{{CATEGORY}}/g, data.category_fr)
      .replace(/{{CATEGORY_AR}}/g, data.category_ar)
      .replace(/{{EXCERPT}}/g, data.excerpt_fr)
      .replace(/{{DATE}}/g, date)
      .replace(/{{CONTENT_FR}}/g, data.content_fr)
      .replace(/{{CONTENT_AR}}/g, data.content_ar);

    await fs.writeFile(postFilePath, postHtml);
    console.log(`Post generated: ${postFileName}`);

    // Update blog.html
    await updateBlogListing(data, postFileName, date);
    
    // Update sitemap
    await updateSitemap(postFileName);

  } catch (error) {
    console.error("Error generating post:", error);
  }
}

async function updateBlogListing(data, fileName, date) {
  const blogPath = path.join(__dirname, "../blog.html");
  let blogHtml = await fs.readFile(blogPath, "utf-8");

  const newCard = `
            <a href="/posts/${fileName}" class="post-card" data-reveal>
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

  // Insert at the top of the grid
  if (blogHtml.includes('id="no-posts"')) {
    // Replace empty state
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
