# Design — Email de confirmation d'inscription Factarlou

**Date :** 2026-08-02
**Statut :** Approuvé par l'utilisateur (direction visuelle « Indigo »)

## Contexte

Les utilisateurs reçoivent actuellement l'email de confirmation d'inscription de
Factarlou envoyé par **Supabase Auth** (template « Confirm signup » du dashboard
Supabase), délivré via **Resend en SMTP** (déjà configuré côté Supabase + domaine
personnalisé Resend). Le contenu HTML actuel est le template par défaut de
Supabase. L'objectif est de fournir un template **moderne, aux couleurs de
l'application (indigo #4f46e5)**, prêt à coller dans le dashboard Supabase.

Deux templates HTML existent dans le code (`app/src/lib/email-templates.ts`) mais
**ne sont jamais utilisés** par l'application (vérifié par grep) : les emails de
confirmation et de réinitialisation partent entièrement de Supabase Auth.

## Objectif

Livrer un **template HTML email-client-safe** pour l'email « Confirm signup »
(création de compte + lien de vérification), que l'utilisateur collera dans :
Supabase Dashboard → Auth → Email Templates → Confirm signup.

## Décisions

1. **Direction visuelle :** Indigo — identité de l'application web (choisie par
   l'utilisateur parmi 3 options : Emerald / Indigo / Minimal noir).
2. **Canal de livraison :** inchangé. Supabase Auth envoie l'email via Resend SMTP
   déjà en place. Aucun changement de code applicatif requis.
3. **Variable du lien :** `{{ .ConfirmationURL }}` (variable Supabase du template
   « Confirm signup »).
4. **Langue :** Français (toute l'app est en français).

## Spécification du template

### Structure (email-client-safe)

- **Wrapping :** `<table>` outer 100%, fond `#eef1f7`, padding vertical 40px.
- **Carte :** 560px max-width, fond blanc, `border-radius: 16px`, `box-shadow`
  léger, `overflow: hidden`, `border: 1px solid #e2e8f0`.
- **Font :** stack système `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  Helvetica, Arial, sans-serif`. Aucune police web (compatibilité clients mail).

### Sections (du haut vers le bas)

1. **Header indigo :** gradient `135deg #6366f1 → #4338ca`, padding 34px/30px,
   centré. Bloc logo : carré blanc arrondi (`border-radius: 12px`, padding
   10px 16px) contenant un **« F » indigo #4338ca** sur fond blanc. Titre
   « Bienvenue sur Factarlou » (blanc, 22px, 800), sous-titre
   « Facturation & Retenue à la Source en Tunisie » (`#c7d2fe`, 13px).
2. **Corps :** padding 36px 40px.
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
3. **Footer :** fond `#f8fafc`, bordure haute `#f1f5f9`, padding 22px 40px,
   centré. « © 2026 Factarlou. Tous droits réservés. » + lien
   `factarlou.online` en indigo.

### Règles techniques

- **100% tables + styles inline** (Outlook, Gmail, Apple Mail). Pas de `<style>`
  dans le `<head>` nécessaire (mais toléré en fallback).
- Émojis limités (🔒 uniquement dans la note sécurité).
- Le template doit rester copiable **tel quel** dans le dashboard Supabase
  (balises `{{ .ConfirmationURL }}` littérales).

## Livrables

1. **Fichier template HTML** en dur dans le dépôt : `app/src/lib/email-templates/`
   → nouveau fichier `confirm-account-template.html` (version à coller dans
   Supabase), avec `{{ .ConfirmationURL }}` littéral.
2. **Mise à jour de `app/src/lib/email-templates.ts` :** remplacer le HTML de
   `getConfirmAccountEmailHtml` par le nouveau design (même fonction, paramètres
   identiques `confirmUrl`, `email`) — garde le code cohérent si utilisé plus tard.
3. **Instructions** dans le template (commentaire HTML en tête) :
   « Collez ce code dans Supabase → Auth → Email Templates → Confirm signup ».
4. **FIXES_LOG.md :** entrée de checkpoint (création du template, selon la
   convention demandée par l'utilisateur).

## Hors périmètre

- Pas de changement du flux d'authentification (signUp/reset restent gérés par
  Supabase Auth).
- Pas d'intégration SDK Resend dans le code.
- Pas de template newsletter (n'existe pas encore dans le code).
- Ne modifie pas l'email de réinitialisation de mot de passe (pourra être une
  suite si demandé).

## Vérification

- Ouvrir le HTML dans un navigateur et vérifier le rendu.
- Vérifier qu'un clic sur le CTA ouvre `{{ .ConfirmationURL }}` (rendu littéral en
  local — normal avant collage dans Supabase).
- Collage par l'utilisateur dans Supabase, puis test réel d'inscription.
