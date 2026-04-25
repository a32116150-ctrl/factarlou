import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";
import { execSync } from "child_process";

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
  
  // Trending Topics specifically for the Tunisian Market
  const topics = [
    "Fiscalité Tunisienne (Déclaration IRPP, Portail TEJ, TVA 2026)",
    "Entrepreneuriat et Innovation (Startups, Levée de fonds en Tunisie)",
    "Technologie et SaaS (Architecture Offline-first, Sécurité des données)",
    "Fintech et Paiements (Réglementations BCT, Solutions de paiement)",
    "Digitalisation des PME (Gestion de stock, Automatisation des factures)",
    "Intelligence Artificielle pour les Entreprises (Optimisation, Prédictions)",
    "Loi de Finances Tunisie : Ce que les entrepreneurs doivent savoir",
    "Transition Digitale : Pourquoi le Local-First est l'avenir de la Tunisie"
  ];
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Rédigez un article de blog EXPERT, PROFOND et PASSIONNANT pour Factarlou.
  Sujet : ${selectedTopic}
  
  L'article doit être extrêmement détaillé (>1200 mots), avec des conseils pratiques, des analyses de marché et une vision technologique forte. 
  Utilisez un ton autoritaire, innovant et premium.
  
  RÉPONDEZ UNIQUEMENT EN JSON :
  {
    "title_fr": "Titre provocateur et magnétique en Français",
    "title_ar": "Titre de haut niveau en Arabe",
    "category_fr": "Catégorie (ex: Fintech, Tech, Fiscalité, Stratégie)",
    "category_ar": "Catégorie en Arabe",
    "excerpt_fr": "Résumé captivant de 2 phrases pour l'aperçu",
    "unsplash_keyword": "Mot-clé anglais pour l'image de couverture",
    "content_fr": "HTML riche : utilisez h2, h3, p, ul, li, et des balises <blockquote class='premium-quote'> pour les citations clés.",
    "content_ar": "HTML riche en Arabe (Même structure que la version FR)"
  }
  
  Positionnez Factarlou comme le leader technologique incontournable en Tunisie.`;

  try {
    let data;
    if (!useFallback && GEMINI_KEY) {
      console.log(`🚀 Attempting generation with Gemini (Topic: ${selectedTopic})...`);
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(jsonStr);
    } else if (groq) {
      console.log(`🛡️ Using Groq Fallback (Topic: ${selectedTopic})...`);
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt + "\nRespond ONLY with JSON." }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      data = JSON.parse(chatCompletion.choices[0].message.content);
    }

    const coverImage = `https://loremflickr.com/1200/800/${data.unsplash_keyword || 'business'}`;
    const slug = `${slugDate}-${data.title_fr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
    const postFileName = `${slug}.html`;
    const postFilePath = path.join(__dirname, "../public/posts", postFileName);

    // Initial simple write (Will be polished by fix-posts.js later)
    await fs.ensureDir(path.dirname(postFilePath));
    await fs.writeFile(postFilePath, `<h1>${data.title_fr}</h1><div class="post-content">${data.content_fr}</div>`);
    console.log(`📄 Raw Post generated: ${postFileName}`);

    // 🔄 RUN AUTOMATION CHAIN
    console.log("⚙️  Running Automation Pipeline...");
    
    // 1. Rebuild Search Index
    await updateSearchIndex(data, postFileName);
    
    // 2. Update Blog Listing
    await updateBlogListing(data, postFileName, date, coverImage);
    
    // 3. Polishing & Version Sync (Fix-posts)
    // This will apply the template, navigation, and Parent Version automatically
    execSync("node scripts/fix-posts.js", { stdio: 'inherit' });

    // 4. Regenerate Sitemap
    execSync("node scripts/auto-sitemap.js", { stdio: 'inherit' });

    console.log(`\n✨ SUCCESS: ${postFileName} is now Live, Styled, and Indexed!`);

  } catch (error) {
    if (error.status === 429 && retryCount < 2 && !useFallback) {
      console.log(`Rate limited. Retrying in 15s...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
      return generatePost(retryCount + 1, false);
    } else if (!useFallback && groq) {
      return generatePost(0, true);
    }
    console.error("❌ Critical Automation Failure:", error);
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
  console.log("🔍 Search Index updated.");
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
  console.log("📰 Blog listing updated.");
}

generatePost();
