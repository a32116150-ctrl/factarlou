import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://factarlou.online";

// Directory submission script for Tunisian business directories
// Run: node scripts/submit-directories.js

const directories = [
  {
    name: "Kompass Tunisie",
    url: "https://tn.kompass.com/",
    submitUrl: null, // Manual submission required
    notes: "Add company profile with link to factarlou.online",
  },
  {
    name: "Pages Jaunes Tunisie",
    url: "https://www.pagesjaunes.com.tn/",
    submitUrl: null,
    notes: "Annuaires des entreprises tunisiennes",
  },
  {
    name: "Yellow Pages TN",
    url: "https://www.yellowpages.com.tn/",
    submitUrl: null,
    notes: "Register business listing",
  },
  {
    name: "Tunisie Annuaire",
    url: "https://www.tunisie-annuaire.com/",
    submitUrl: null,
    notes: "Free business listing",
  },
  {
    name: "MyTunisia Business",
    url: "https://www.mytunisia.com/",
    submitUrl: null,
    notes: "Tunisian business directory",
  },
  {
    name: "Annuaire Tunisien",
    url: "https://www.annuaire.tn/",
    submitUrl: null,
    notes: "Free listing available",
  },
  {
    name: "Espace Manager",
    url: "https://www.espacemanager.com.tn/",
    submitUrl: null,
    notes: "Business magazine, contact for backlink opportunity",
  },
  {
    name: "Business News Tunisie",
    url: "https://www.businessnews.com.tn/",
    submitUrl: null,
    notes: "Contact editorial team for article coverage",
  },
  {
    name: "Tekiano",
    url: "https://www.tekiano.com/",
    submitUrl: null,
    notes: "Tech news Tunisie — pitch Factarlou as startup story",
  },
  {
    name: "Kapitalis",
    url: "https://kapitalis.com/",
    submitUrl: null,
    notes: "Tunisian economic and financial news",
  },
  {
    name: "SourceCode Tunisia (Awesome Lists)",
    url: "https://github.com/topics/tunisia",
    submitUrl: "https://github.com/search?q=awesome+tunisia&type=repositories",
    notes: "Find awesome-tunisia repos and submit PR adding Factarlou",
  },
  {
    name: "AlternativeTo",
    url: "https://alternativeto.net/",
    submitUrl: "https://alternativeto.net/software/suggestion/",
    notes: "List Factarlou as alternative to Hesabi, Swiver, etc.",
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com/",
    submitUrl: "https://www.producthunt.com/products/new",
    notes: "Launch Factarlou as a Product Hunt listing",
  },
];

console.log(`📋 Directory Submission Plan for ${BASE_URL}\n`);
console.log("=".repeat(60));
console.log("These directories require manual registration or form submission:\n");

directories.forEach((d, i) => {
  console.log(`${i + 1}. ${d.name}`);
  console.log(`   URL: ${d.url}`);
  if (d.submitUrl) console.log(`   Submit: ${d.submitUrl}`);
  console.log(`   Action: ${d.notes}`);
  console.log();
});

console.log("=".repeat(60));
console.log("\n📡 Generating outreach email template...\n");

const emailTemplate = `Objet : Présentation de Factarlou — Logiciel de facturation tunisien gratuit

Bonjour,

Je vous contacte pour vous présenter Factarlou (https://factarlou.online), un logiciel de facturation tunisien gratuit, conçu spécifiquement pour les entrepreneurs et PME en Tunisie.

Factarlou se distingue par :
✅ Factures conformes à la TVA tunisienne (multi-taux, timbre fiscal, FODEC)
✅ Export XML TEJ compatible avec le portail fiscal
✅ Point de vente (POS) intégré
✅ 100% local-first — données privées, zéro cloud
✅ Gratuit, sans abonnement

Nous sommes une startup tunisienne et nous cherchons à faire connaître notre solution auprès des professionnels en Tunisie.

Souhaitez-vous nous mentionner dans votre annuaire / article ?

Cordialement,
Anoir Cherif
https://factarlou.online
`;

console.log(emailTemplate);

console.log("\n✅ Plan generated. Start submitting manually, or set up API access where available.");
