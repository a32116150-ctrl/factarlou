# Factarlou — Log des corrections (Checkpoint)

Ce fichier sert de point de contrôle : chaque correction appliquée au projet est ajoutée ci-dessous après avoir été vérifiée (build / typecheck / lint) et poussée sur `main`.

---

## 2026-08-02 — Import TEJ : rejet des PDF/fichiers binaires + bouton Actualiser + suppression par ligne

**Contexte / bug :**
Un PDF (ou tout fichier non textuel) déposé dans l'outil "Convertir / Saisir des certificats" de la page d'export TEJ était lu comme texte brut (`FileReader.readAsText`) puis tombait dans la branche CSV trop permissive (`fileName.endsWith('.csv') || text.includes(';')`). Cela fabriquait des lignes "certificats" bidons (`RS-2026-08-xxxx`, `%PDF-1.4`, `1 0 obj`, `endobj`, `%%EOF`, etc.) persistées en base via `POST /app/api/retenues`, qui réapparaissaient ensuite dans le tableau principal et dans les totaux.

**Correctifs apportés** (`app/src/app/(app)/export-tej/page.tsx`) :
- Validation stricte de l'extension : seuls `csv`, `txt`, `json`, `xml` sont acceptés ; sinon toast d'erreur et annulation (plus aucun parsing).
- Détection de contenu : rejet immédiat si le texte commence par `%PDF-` ou contient des octets NUL (`\u0000`, marqueur de fichier binaire).
- Resserrement de la détection CSV : `text.includes(';')` supprimé, seul un fichier `.csv` déclenche le parsing CSV.
- Ajout du bouton **"Actualiser"** (icône `RefreshCw` animée) dans l'en-tête de la page → recharge les données depuis `/app/api/retenues`.
- Ajout d'une colonne **Action** avec bouton poubelle par ligne → `DELETE /app/api/retenues/[id]` pour purger les certificats bidon déjà enregistrés.
- Gestion du drag & drop sur la zone de dépôt (`onDragOver` + `onDrop` avec `parseBrowserFile`).

**Vérifications :** `tsc --noEmit` OK · `next build` OK · lint sans nouvelle erreur (les 4 erreurs signalées pré-existaient à ce correctif).

**Fichiers modifiés :**
- `app/src/app/(app)/export-tej/page.tsx`
- `FIXES_LOG.md` (ce fichier)

---

## 2026-08-02 — Emails transactionnels : templates modernes indigo (confirm, reset, newsletter)

**Contexte :**
Les emails de confirmation d'inscription et de réinitialisation de mot de passe partaient avec le template par défaut de Supabase Auth (délivré via Resend en SMTP). Les anciens templates dans `app/src/lib/email-templates.ts` n'étaient jamais utilisés et utilisaient une couleur verte (#10b981) qui ne correspondait pas à l'identité réelle de l'app (indigo #4f46e5). Pas de template newsletter.

**Correctifs apportés :**
- **Design system commun indigo** : gradient `#6366f1 → #4338ca`, logo « F », carte blanche 560px, footer standard — 100% tables + styles inline (compatible Gmail/Outlook/Apple Mail).
- **`confirm-account-template.html`** (nouveau) : à coller dans Supabase → Auth → Email Templates → Confirm signup. CTA indigo « Activer mon compte » sur `{{ .ConfirmationURL }}`, boîte features lavande, note sécurité, lien fallback.
- **`reset-password-template.html`** (nouveau) : à coller dans Supabase → Auth → Email Templates → Reset Password. CTA « Réinitialiser mon mot de passe » sur `{{ .ConfirmationURL }}`.
- **`newsletter-template.html`** (nouveau) : à utiliser dans Resend (Broadcast). Bloc éditorial + liste d'articles + CTA vers `factarlou.online/blog` + ligne désinscription.
- **`app/src/lib/email-templates.ts`** : `getConfirmAccountEmailHtml` et `getResetPasswordEmailHtml` mis à jour avec les nouveaux designs (signatures inchangées).

**Vérifications :** `tsc --noEmit` OK · `next build` OK · rendu HTML vérifié.

**Fichiers modifiés :**
- `app/src/lib/email-templates/confirm-account-template.html` (nouveau)
- `app/src/lib/email-templates/reset-password-template.html` (nouveau)
- `app/src/lib/email-templates/newsletter-template.html` (nouveau)
- `app/src/lib/email-templates.ts`
- `FIXES_LOG.md` (ce fichier)

---

## 2026-08-02 — PDF export web : fichiers corrompus / mal mis en page (fixed)

**Contexte / bug :**
Les PDF téléchargés depuis l'app web (factures, attestations de retenue) arrivaient corrompus et mal mis en page. Deux causes dans `app/src/lib/pdfDownloader.ts` :

1. **Mini-CSS incomplet :** le téléchargement copiait le `innerHTML` de la facture dans un iframe stylé par une mini-CSS manuscrite (~63 classes). Les composants utilisent ~140+ classes Tailwind (dont des valeurs arbitraires comme `p-2.5`, `max-w-[210mm]`, `text-[10px]`) absentes de cette mini-CSS, et certaines clés étaient même erronées (`.p-2-5`/`.pt-3-5` au lieu de `.p-2.5`/`.pt-3.5`). Résultat : mise en page cassée (pas de bordures, pas d'espacements, images en pleine taille, tableaux non collés).
2. **Écrasement sur une page :** `pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight))` compressait tout le contenu sur une seule page A4 — toute facture dépassant la page était écrasée ou tronquée (fichier "endommagé").

**Correctif apporté** (`app/src/lib/pdfDownloader.ts`) :
- **Flatten des styles réels :** clonage de l'élément + copie de tous les styles calculés (`getComputedStyle`) en styles inline, avec conversion des couleurs `oklch/oklab/lab/hsl` → `rgb` (via round-trip canvas) pour que html2canvas ne lève plus d'erreur. Le rendu reflète exactement l'écran, sans dépendre d'une mini-CSS.
- **Pagination multipage :** le canvas est étalé sur plusieurs pages A4 (décalage vertical par page) au lieu d'être écrasé — les longues factures sont désormais découpées proprement.
- Les images sont converties en base64 sur le **clone** (le DOM live n'est plus muté).

**Vérifications :** `tsc --noEmit` OK · `next build` OK. Test visuel à faire côté navigateur (télécharger une facture + une attestation, vérifier rendu et multi-pages).

**Fichiers modifiés :**
- `app/src/lib/pdfDownloader.ts`
- `FIXES_LOG.md` (ce fichier)
