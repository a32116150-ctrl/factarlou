# Factarlou Web — Desktop Parity Design

Date: 2026-07-31
Status: Approved (user: "matching the original desktop version in everything design and functionalities")

## 1. Goal

Make the web app at `factarlou.online/app` (Next.js + Supabase) a faithful replica of the
desktop app (Electron, `tuniinvoice-desktop` v5.0.2): **same design, same functionality, same
look-and-feel**, running smoothly on the web. The desktop app is the reference spec.

## 2. Reference

- Desktop source: `/Users/anoircherif/Desktop/dev project/app backup  tun/1.6/tuniinvoice-desktop`
- Design source of truth: `src/renderer/styles.css` (1297 lines), `src/renderer/index.html`, `app-features.js` (428 functions), `builders/*.js`
- Web source: `/Users/anoircherif/Desktop/dev project/app backup  tun/factarlou/app`
- Web data model: `app/supabase/schema.sql` (24 tables, mirrors desktop's 25 minus POS-only tables)

## 3. Design System (Section 1 — approved)

Light theme, indigo accent, Inter font. Exact tokens from desktop `styles.css` `:root`:

| Token | Value |
|---|---|
| `--primary` | `#4f46e5` |
| `--primary-dark` | `#4338ca` |
| `--primary-light` | `#818cf8` |
| `--primary-bg` | `#f5f3ff` |
| `--secondary` | `#64748b` |
| `--success` / bg | `#10b981` / `#d1fae5` |
| `--danger` / bg | `#ef4444` / `#fee2e2` |
| `--warning` / bg | `#f59e0b` / `#fef3c7` |
| `--info` / bg | `#06b6d4` / `#e0f7fa` |
| `--bg` | `#f0f4f8` (page), cards `#ffffff` |
| `--text` / secondary / muted / light | `#0f172a` / `#475569` / `#94a3b8` / `#cbd5e1` |
| `--border` / light | `#e2e8f0` / `#f1f5f9` |
| radii | 6 / 10 / 14 / 20 px |
| shadows | xs→xl per desktop scale |
| `--sidebar-w` | `260px` (collapsed `60px`) |
| `--topbar-h` | `64px` |
| font | Inter (via `next/font/google`), 14px base |

### Components (match desktop markup)

- **Buttons** `.btn` (+`-primary/-secondary/-success/-danger/-warning/-small/-icon`); icon variants colored borders: view=sky `#bae6fd`, edit=amber `#fde68a`, delete=red `#fecaca`, pdf=violet `#ddd6fe`, convert=green `#bbf7d0`
- **Forms** `.form-group`: 0.8rem semibold slate-600 label, white input, `--border`, indigo focus ring `0 0 0 3px rgba(37,99,235,0.1)`, password-toggle, `.btn-random`, `.input-group`
- **Cards** `.card`: white, `--radius-lg` 14px, `--border`, header with bottom `--border-light`; hover shadow
- **Stat cards** `.stat-card`: 3-col grid, icon boxes (blue/green/orange/red pastels), hover gradient top-bar `primary→primary-light`, `.stat-badge.up/down`
- **Tables**: thead gradient `gray-50→#f8fafc`, 0.78rem slate-600 headers, hover row `gray-50` + 3px indigo-left inset on first cell; `.actions-cell`; pagination `.page-btn.active` indigo
- **Badges**: pastel pills — `facture` `#dbeafe/#1d4ed8`, `ticket` `#f0fdf4/#059669`, `devis` `#fef3c7/#92400e`, `bon` `#d1fae5/#065f46`, `active/paid` green, `pending` amber
- **Auth screen**: gradient `135deg #1e3a5f → #4f46e5 → #0ea5e9`, white 440px card (radius 20px, heavy shadow), tabbed Login / Register, logo block
- **Toasts**: top-right white cards, 4px colored left border by type, desktop animations
- **Sidebar nav** (sections exactly as desktop `index.html`):
  - *Principal*: Tableau de bord, Nouveau Document
  - *Gestion*: Mes Documents, Clients, Fournisseurs, Services & Produits, Mon Entreprise, Contrats, Ressources Humaines, Achats & Dépenses, Retenue à la Source, TEJ Export, Outils
  - *Ventes*: Point de Vente (shown, "Bientôt" — deferred)
  - *Productivité*: Notes
  - *Système*: Journal d'Activité, Paramètres
  - Active item: `--primary-bg` + indigo text + `inset 3px 0 0 --primary`; hover `gray-100`
- **Topbar**: hamburger (collapse), breadcrumb, global search (280px, gray-100 pill, indigo focus), current-date pill, user pill (avatar + name)

## 4. Architecture & Performance (Section 2 — approved)

- **Keep existing code**, restyle to desktop design, then add modules by phase.
- **Data access**: pages as Server Components fetching Supabase directly (fast, desktop-like). Client components only where interactive (forms, lists w/ filters). API routes kept for the operations that need them (auth callback, cron, import). Single source of truth per module — avoid the existing dashboard/api duplicate pattern.
- **Pagination**: lists paginated 25–50 rows; documents list keeps search/type/status/date filters + pagination.
- **Lazy loading**: Tesseract.js, xlsx, chart code loaded on demand only when feature opened.
- **Charts**: lightweight custom SVG/canvas components matching desktop's vanilla-chart look (no heavy chart lib) — dashboard + POS-deferred.
- **State**: Zustand for auth + settings; forms as controlled components.
- **Background jobs**: Vercel Cron (daily) → internal API route → generate overdue recurring invoices + send relance/reminder emails via stored SMTP settings.
- **PDFs**: print-based A4 templates upgraded to desktop parity (all 11 doc types + proforma, retenue attestation, 10 contract types, payslip, relance letter, PV, fiscal summary). Theme support from `document_themes`, QR code when `show_qr`, logo/stamp/signature toggles.
- **Deployment**: unchanged — two Vercel projects (root marketing site + `app` Root Directory), `basePath: '/app'`, root `vercel.json` rewrite.

## 5. Data Model

Supabase schema already covers desktop tables. Notes:
- Skip POS tables (`pos_sessions`, `pos_loyalty`) — POS deferred.
- Add `login_attempts`-style hardening only if rate-limiting needed (currently Supabase-managed).
- Keep amounts as REAL (desktop uses REAL too — parity over precision).

## 6. Modules by Phase (Section 3 — approved)

Built in desktop sidebar order. Each module = full parity (screens, modals, calculations, PDFs).

### P0 — Fondation
1. Light indigo design system (Section 3 tokens) in Tailwind v4 `@theme` + component restyle (Button, Input, Select, Textarea, Badge, Card, Modal, Table, Toast).
2. AppShell: sidebar 260px collapsible (desktop sections + icons + user card + version footer), topbar 64px (breadcrumb, search, date, user).
3. Auth screens restyled to desktop gradient card (login/register); confirm-email notice screen.
4. Fix known bugs: expense delete (missing `api/expenses/[id]`), `/forgot-password` page, `/auth-code-error` page.
5. `npm run lint` + `npm run build` green; manual walkthrough of all existing screens.

### P1 — Documents
- **Dashboard**: desktop stats grid (6 cards), revenue chart, recent docs compact table, quick actions (Nouveau facture/devis, client, retenue).
- **Nouveau Document**: full editor — 11 doc types + proforma, client selector, line items (qty/unit/price/TVA/line total), discount % or amount, timbre, FODEC, payment mode, currency (TND/EUR/USD + exchange rate), custom fields, internal notes, save as template, recurring-invoice setup.
- **Mes Documents**: list w/ filters + pagination, edit document (full editor re-open), duplicate, convert (devis→facture, etc.), mark paid / record payment, relances, tags, delete. Document detail = PDF preview + actions.
- **Encaissements / payments**: payments table per document, partial payments, `payment_status/paid_amount/paid_date` maintenance.
- **Relances**: per-invoice relance log (attempt, method, recipient, sent_at), email + PDF relance letter via SMTP.
- **Factures récurrentes**: manage recurring templates; daily Vercel cron generates due ones.
- **Modèles & thèmes**: saved `document_templates` (named), `document_themes` presets + custom builder; apply per document.
- **Tags**: `document_tags` join table UI.
- **PDFs**: invoice-builder parity — logo/QR/accent theme, per-type titles, timbre line, TVA breakdown, totals, French A4 print.

### P2 — Relations
- **Clients**: desktop parity — detail page (profile, stats-mini-row, documents history, balances, overdue, credit limit), import CSV/XLSX, avatar initials, tags.
- **Fournisseurs**: full CRUD UI (table exists, currently no UI).
- **Services & Produits**: categories management (`service_categories` w/ color), stock/barcode fields already present.
- **Mon Entreprise**: company profile + logo/stamp/signature uploads + display toggles (`show_logo/show_stamp/show_signature/show_qr/show_accent`) + QR.

### P3 — Contrats & RH
- **Contrats**: list + editor, 10 contract types, employer/employee blocks, statuses, `contract-builder` PDF parity (Times New Roman, French A4).
- **Ressources Humaines**: employés (CRUD, CIN/CNSS, role, dept, salary, allowances, active) + **fiches de paie** generator (CNSS + IRPP brackets already in `lib/math-utils.ts`), payslip PDF parity, monthly generation, statuses.

### P4 — Finance
- **Achats & Dépenses**: parity list + form, **edit** (currently missing), attachment upload (expense-attachments bucket), recurring expenses if desktop has them, HT/TVA/retenue→TTC calc.
- **Retenue à la Source**: list w/ filters, edit (currently missing PUT), link to `facture_id`, attach logo/stamp/signature at creation, official attestation PDF parity.
- **TEJ Export**: generate XML per RS + TEIF schemas (downloadable), fiscal summary.

### P5 — Productivité
- **Outils** (17 tool cards, `.tools-grid`): MF validator, IRPP calculator, CNSS calculator, TVA calculator, calendar, currency converter (uses `exchange_rates`), PV generator, penalty calculator, scenario simulator, graphe relationnel (Apriori), finance directory, etc. — port each from `app-features.js`.
- **Notes**: sticky notes (title, content, color, pinned).
- **Journal d'Activité**: read `activity_log` (already written), filters by action/entity/date.

### P6 — Système
- **Paramètres**: 7 tabs — Général (decimals, rounding, default currency + Devises), Documents (prefixes, per-type numbering via `doc_counters`, themes), Apparence (theme preset picker), Email (SMTP presets Gmail/Outlook/Yahoo/La Poste + test), Sauvegarde (export/restore), Automatisation (recurring + reminders scheduling toggles).
- **Backup & Import**: export web data as JSON/ZIP; import from desktop (CSV/XLSX mapping for clients/fournisseurs/services/expenses/documents) via `xlsx`.
- **OCR Scanner**: Tesseract.js in-browser (fra+ara) reading documents → fill client/invoice fields.
- **Cron wiring**: recurring invoices + reminders via Vercel Cron.

## 7. Error Handling & Quality (Section 4 — approved)

- Desktop-style toasts for all feedback; validation parity (MF format, CIN, required fields).
- All accounting math through `lib/math-utils.ts`/`constants.ts` (totals, IRPP, CNSS, exchange rates, doc counters).
- Per phase: `npm run lint` (0 errors) + `npm run build` green + manual screen walkthrough.
- TypeScript strict; no `any`; no new deps without need.

## 8. Out of Scope / Deferred

- **POS** (Point de Vente): deferred — sidebar entry shown with "Bientôt".
- **OCR**: in P6, best-effort (web OCR is imperfect).
- **Desktop-only**: local SQLite file access, safeStorage/master-key recovery, auto-updates, offline mode, node-cron local scheduling. Not applicable on web; Supabase auth replaces local users.
- **Tesseract heavy models**: only fra+ara loaded, on demand.

## 9. Risks

- **Effort**: full parity is many modules; phases keep app usable throughout.
- **Desktop as moving spec**: freeze desktop v5.0.2 behavior as reference; document deviations.
- **Web OCR quality**: set expectations; manual entry fallback always present.
- **Supabase latency vs local SQLite**: mitigated via server components + pagination + caching.
