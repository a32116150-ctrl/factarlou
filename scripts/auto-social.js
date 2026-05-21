import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://factarlou.online";
const postsDir = path.join(__dirname, "../public/posts");

// Auto-generate social media post content for the latest blog article
// To use: set TWITTER_BEARER_TOKEN, LINKEDIN_TOKEN env vars
// Then run: node scripts/auto-social.js

const TWITTER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const LINKEDIN_TOKEN = process.env.LINKEDIN_TOKEN;

async function getLatestPost() {
  const files = await fs.readdir(postsDir);
  const htmlFiles = files.filter(f => f.endsWith(".html")).sort().reverse();
  if (htmlFiles.length === 0) return null;
  const latest = htmlFiles[0];
  const content = await fs.readFile(path.join(postsDir, latest), "utf-8");
  const titleMatch = content.match(/<title>([^<]+?) — Factarlou<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : "Article Factarlou";
  const excerptMatch = content.match(/<meta name="description" content="([^"]+)">/);
  const excerpt = excerptMatch ? excerptMatch[1] : "Découvrez l'article sur Factarlou";
  return { title, excerpt, url: `${BASE_URL}/posts/${latest}` };
}

function generateTweet(post) {
  const tweet = `🇹🇳 ${post.title}\n\n${post.excerpt.slice(0, 120)}...\n\n📖 ${post.url}\n\n#Tunisie #Facturation #Fiscalité`;
  return tweet.slice(0, 280);
}

function generateLinkedInPost(post) {
  return {
    text: `🇹🇳 ${post.title}\n\n${post.excerpt}\n\n📖 Lire l'article complet : ${post.url}\n\n---\nFactarlou — Logiciel de facturation tunisien gratuit. Conforme TVA, export XML TEJ, POS intégré. 100% local-first.\n#Tunisie #Facturation #Fiscalité #ERP #Entrepreneuriat`,
  };
}

async function postToTwitter(post) {
  if (!TWITTER_TOKEN) {
    console.log("⚠️  TWITTER_BEARER_TOKEN not set. Skipping Twitter post.");
    console.log("📝 Would post:", generateTweet(post));
    return;
  }
  // Requires Twitter API v2 with OAuth 2.0
  const tweet = generateTweet(post);
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TWITTER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweet }),
  });
  const data = await response.json();
  console.log(`🐦 Twitter: ${response.status} — ${data?.data?.id ? "Posted" : JSON.stringify(data)}`);
}

async function postToLinkedIn(post) {
  if (!LINKEDIN_TOKEN) {
    console.log("⚠️  LINKEDIN_TOKEN not set. Skipping LinkedIn post.");
    console.log("📝 Would post:", generateLinkedInPost(post).text);
    return;
  }
  const body = generateLinkedInPost(post);
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LINKEDIN_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${process.env.LINKEDIN_URN}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: body.text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = await response.json();
  console.log(`💼 LinkedIn: ${response.status} — ${data?.id ? "Posted" : JSON.stringify(data)}`);
}

async function main() {
  console.log("📡 Auto-Social Media Poster\n");
  const post = await getLatestPost();
  if (!post) {
    console.log("No blog posts found.");
    return;
  }
  console.log(`Latest: ${post.title}`);
  console.log(`URL: ${post.url}\n`);

  await postToTwitter(post);
  await postToLinkedIn(post);

  // Generate WhatsApp share URL
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(post.title + " " + post.url)}`;
  console.log(`\n📱 WhatsApp share link: ${whatsappUrl}`);

  // Generate Facebook share URL
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.url)}`;
  console.log(`📘 Facebook share link: ${fbUrl}`);
}

main();
