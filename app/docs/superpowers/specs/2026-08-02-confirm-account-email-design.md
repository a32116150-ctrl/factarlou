# Design — Emails transactionnels Factarlou (confirm, reset, newsletter)

**Date :** 2026-08-02
**Statut :** Approuvé par l'utilisateur (direction visuelle « Indigo »)

## Contexte

Les utilisateurs reçoivent actuellement les emails de confirmation d'inscription
et de réinitialisation de mot de passe de Factarlou envoyés par **Supabase Auth**
(templates du dashboard Supabase), délivrés via **Resend en SMTP** (déjà configuré
côté Supabase + domaine personnalisé Resend). Le contenu HTML actuel est le
template par défaut de Supabase. L'objectif est de fournir des templates
**modernes, aux couleurs de l'application (indigo #4f46e5)**, prêts à coller dans
le dashboard Supabase, plus un **template de newsletter** prêt à coller dans Resend.

Deux templates HTML existent dans le code (`app/src/lib/email-templates.ts`) mais
**ne sont jamais utilisés** par l'application (vérifié par grep) : les emails de
confirmation et de réinitialisation partent entièrement de Supabase Auth.

## Objectif

Livrer **3 templates HTML email-client-safe**, partageant le même design system
indigo :

1. **Confirm signup** (création de compte + lien de vérification) → à coller dans
   Supabase → Auth → Email Templates → Confirm signup.
2. **Reset password** → à coller dans Supabase → Auth → Email Templates →
   Reset Password.
3. **Newsletter** → à coller dans Resend (Audience + Broadcast) — pas de code
   backend.

## Décisions

1. **Direction visuelle :** Indigo — identité de l'application web (choisie par
   l'utilisateur parmi 3 options : Emerald / Indigo / Minimal noir).
2. **Canal de livraison :** inchangé. Supabase Auth envoie les emails
   transactionnels via Resend SMTP déjà en place ; la newsletter part de Resend
   directement. Aucun changement du flux d'authentification.
3. **Variable du lien :** `{{ .ConfirmationURL }}` (variable Supabase des
   templates « Confirm signup » et « Reset Password »).
4. **Langue :** Français (toute l'app est en français).

## Design system commun

### Structure (email-client-safe)

- **Wrapping :** `<table>` outer 100%, fond `#eef1f7`, padding vertical 40px.
- **Carte :** 560px max-width, fond blanc, `border-radius: 16px`, `box-shadow`
  léger, `overflow: hidden`, `border: 1px solid #e2e8f0`.
- **Font :** stack système `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  Helvetica, Arial, sans-serif`. Aucune police web (compatibilité clients mail).

### Header (commun aux 3)

- Gradient `135deg #6366f1 → #4338ca`, padding 34px/30px, centré.
- Bloc logo : carré blanc arrondi (`border-radius: 12px`, padding 10px 16px)
  contenant un **« F » indigo #4338ca** sur fond blanc.
- Titre blanc (22px, 800) + sous-titre `#c7d2fe` (13px) « Facturation & Retenue à
  la Source en Tunisie ».

### Footer (commun aux 3)

- Fond `#f8fafc`, bordure haute `#f1f5f9`, padding 22px 40px, centré.
- « © 2026 Factarlou. Tous droits réservés. » + lien `factarlou.online` en indigo.

### Règles techniques

- **100% tables + styles inline** (Outlook, Gmail, Apple Mail). Pas de `<style>`
  dans le `<head>` nécessaire (mais toléré en fallback).
- Émojis limités (🔒 uniquement dans les notes sécurité).
- Les templates Supabase doivent rester copiables **tels quels** (balises
  `{{ .ConfirmationURL }}` littérales).

## 1. Email de confirmation (Confirm signup)

### Sections (du haut vers le bas)

- **Header indigo :** titre « Bienvenue sur Factarlou », sous-titre standard.
- **Corps :** padding 36px 40px.
  - H2 « Votre compte est presque prêt » (`#0f172a`, 19px, 700).
  - Paragraphe d'accueil + explication (`#475569`, 14px, line-height 1.7).
  - **CTA :** `<table>` centré → `<a href="{{ .ConfirmationURL }}">`, bouton
    indigo `#4f46e5` (border `#4338ca`, `border-radius: 10px`, padding
    14px 34px, blanc, 700, `display: inline-block`), texte « Activer mon compte ».
  - **Boîte features :** fond `#f5f3ff`, bordure `#ede9fe`,
    `border-radius: 10px`, padding 16px 18px. Titre « Ce que vous pouvez faire : »
    (`#4338ca`, 13px, 700) + 4 puces avec ✓ :
    - Factures, devis, avoirs et bons de commande personnalisés
    - Calcul auto du timbre fiscal & retenues à la source (TND)
    - Export XML TEJ prêt pour la DGI
    - Applications mobile & ordinateur
  - **Note sécurité :** séparateur `#f1f5f9`, texte 12px `#94a3b8` :
    « 🔒 Lien sécurisé : ce lien est valide temporairement et à usage unique. Si
    vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet
    email en toute sécurité. »
  - **Lien fallback :** zone `#f8fafc` (bordure `#e2e8f0`, radius 8px) avec le
    lien brut `{{ .ConfirmationURL }}` affiché en indigo, cliquable.
- **Footer standard.**

## 2. Email de réinitialisation (Reset Password)

### Sections (du haut vers le bas)

- **Header indigo :** titre « Réinitialisation de votre mot de passe », sous-titre
  standard.
- **Corps :** padding 36px 40px.
  - H2 « Réinitialisation de votre mot de passe » (`#0f172a`, 19px, 700).
  - Paragraphe : « Vous avez demandé la réinitialisation de votre mot de passe
    pour votre compte Factarlou. Cliquez sur le bouton ci-dessous pour créer un
    nouveau mot de passe. » (`#475569`, 14px, line-height 1.7).
  - **CTA :** bouton indigo identique au confirm, texte « Réinitialiser mon mot
    de passe » → `{{ .ConfirmationURL }}`.
  - **Note sécurité :** « 🔒 Si vous n'êtes pas à l'origine de cette demande,
    vous pouvez ignorer cet email en toute sécurité. Votre mot de passe restera
    inchangé. »
  - **Lien fallback :** zone grise identique au confirm avec le lien brut.
- **Footer standard.**

## 3. Newsletter (template Resend)

### Sections (du haut vers le bas)

- **Header indigo :** titre « Factarlou — Actualités & Astuces », sous-titre
  standard.
- **Corps éditorial :** padding 36px 40px.
  - Titre de l'édition (« Factarlou Infos — [Édition] ») (`#0f172a`, 19px, 700).
  - Paragraphe d'intro éditoriale (`#475569`, 14px, line-height 1.7).
  - **Bloc image placeholder :** rectangle `#eef2f7` hauteur ~160px,
    `border-radius: 10px`, avec étiquette « Votre visuel ici » (`#94a3b8`).
  - **Liste de 3-4 articles/astuces** : lignes séparées par `#f1f5f9`, chacune
    avec une petite flèche indigo « → » et un texte `#0f172a` (14px, 600) +
    description `#64748b` (13px).
  - **CTA :** bouton indigo « Découvrir sur factarlou.online » →
    `https://factarlou.online/blog`.
- **Footer standard + ligne désinscription :** « Vous recevez cet email car vous
  êtes abonné(e) aux actualités Factarlou. » + lien
  « Se désinscrire » (Resend gère l'URL de désinscription automatiquement).

## Livrables

1. **3 fichiers template HTML** en dur dans le dépôt :
   `app/src/lib/email-templates/`
   - `confirm-account-template.html` (version Supabase, `{{ .ConfirmationURL }}`)
   - `reset-password-template.html` (version Supabase, `{{ .ConfirmationURL }}`)
   - `newsletter-template.html` (version Resend)
2. **Mise à jour de `app/src/lib/email-templates.ts` :** remplacer le HTML de
   `getConfirmAccountEmailHtml` et `getResetPasswordEmailHtml` par les nouveaux
   designs (mêmes signatures `confirmUrl`/`email` et `resetUrl`/`email`) — garde
   le code cohérent si utilisé plus tard.
3. **Instructions** dans chaque template (commentaire HTML en tête) : où le coller
   (Supabase → Auth → Email Templates → Confirm signup / Reset Password, ou
   Resend).
4. **FIXES_LOG.md :** entrée de checkpoint (création des 3 templates).

## Hors périmètre

- Pas de changement du flux d'authentification (signUp/reset restent gérés par
  Supabase Auth).
- Pas d'intégration SDK Resend dans le code ; le formulaire newsletter du site
  reste tel quel (mailto) — seul le template de newsletter est livré.

## Vérification

- Ouvrir les HTML dans un navigateur et vérifier le rendu.
- Vérifier qu'un clic sur les CTA ouvre `{{ .ConfirmationURL }}` (rendu littéral
  en local — normal avant collage dans Supabase).
- Collage par l'utilisateur dans Supabase/Resend, puis test réel (inscription,
  reset, envoi newsletter).
