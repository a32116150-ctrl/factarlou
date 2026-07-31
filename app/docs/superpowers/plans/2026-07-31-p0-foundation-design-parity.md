# P0 — Foundation: Desktop Design Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the web app's dark/blue UI into the desktop app's light/indigo design, rebuild the app shell (sidebar 260px collapsible + topbar 64px) and auth screens to match the desktop, and fix the known P0 bugs (expense delete, missing pages).

**Architecture:** Design tokens live in `globals.css` (Tailwind v4 `@theme inline`) mapped to CSS vars; all UI primitives in `src/components/ui/*` consume the tokens; the `(app)` layout renders the new desktop shell; auth pages use a shared `AuthCard`. Restyle is done via a dark→light class mapping table applied per page. No new dependencies; no test framework exists (repo gate = `npm run lint` + `npm run build` + manual/curl checks).

**Tech Stack:** Next.js 16.2.12 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS v4, lucide-react, Supabase (`@supabase/ssr`), zustand.

## Global Constraints

- **Design tokens** (from spec §3, desktop `styles.css:5-57`) — EXACT values:
  `--primary:#4f46e5` `--primary-dark:#4338ca` `--primary-light:#818cf8` `--primary-bg:#f5f3ff`
  `--secondary:#64748b` `--success:#10b981` `--success-bg:#d1fae5` `--danger:#ef4444` `--danger-bg:#fee2e2`
  `--warning:#f59e0b` `--warning-bg:#fef3c7` `--info:#06b6d4` `--info-bg:#e0f7fa`
  `--bg:#f0f4f8` `--bg-white:#ffffff` `--text:#0f172a` `--text-secondary:#475569` `--text-muted:#94a3b8`
  `--text-light:#cbd5e1` `--border:#e2e8f0` `--border-light:#f1f5f9` `--sidebar-w:260px` `--topbar-h:64px`
- **Font:** Inter via `next/font/google` (replaces Outfit).
- **Dark→light class mapping** (applies to every page restyle task). Replace:
  - `bg-slate-950` → `bg-bg`; `bg-slate-900` / `bg-slate-900/60` → `bg-white`
  - `bg-slate-800` (input bg) → `bg-white`; `bg-slate-800/30` or `/50` (hover/section bg) → `bg-gray-50`
  - `border-slate-800` → `border-border-light`; `border-slate-700` / `border-slate-600` → `border-border-color`
  - `text-slate-100` / `text-slate-200` → `text-text`; `text-slate-300` → `text-text-secondary`; `text-slate-400` / `text-slate-500` → `text-text-muted`
  - `text-blue-400` → `text-primary`; `text-blue-300` → `text-primary-dark`; `bg-blue-600` → `bg-primary`; `bg-blue-700` → `bg-primary-dark`
  - `bg-blue-600/15` or `/10` (active nav) → `bg-primary-bg`; `ring-blue-600` / `focus:ring-blue-600` → `ring-primary`
  - `hover:bg-slate-800` → `hover:bg-gray-100`; `hover:text-red-400` → `hover:text-danger`; `text-red-400` → `text-red-600`
  - `divide-slate-800/60` → `divide-border-light`; `placeholder-slate-500` → `placeholder-text-light`
  - `shadow-blue-950/40` → `shadow-primary/20`; `hover:bg-red-400` → `hover:bg-danger`
- **Verification gate per task:** `npm run lint` must show 0 errors (run in `/Users/anoircherif/Desktop/dev project/app backup  tun/factarlou/app`). Run `npm run build` after Tasks 3, 6, and 10. Dev server: `http://localhost:3000` (basePath `/app`).
- **No new dependencies.** No `any`. French UI text. Read `node_modules/next/dist/docs/` before using any Next.js API (AGENTS.md).

---

### Task 1: Design tokens + Inter font

**Files:**
- Modify: `src/app/globals.css` (full rewrite)
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS vars `--primary`, `--primary-bg`, `--bg`, `--border`, `--border-light`, `--text`, `--text-secondary`, `--text-muted`, `--text-light`, etc. and Tailwind v4 utilities `bg-primary`, `text-primary`, `bg-primary-bg`, `bg-bg`, `border-border-color`, `border-border-light`, `text-text`, `text-text-secondary`, `text-text-muted`, `placeholder-text-light`, `divide-border-light`, `ring-primary`, `shadow-primary/20`. Also the `--font-inter` variable consumed by Task 2+.

- [ ] **Step 1: Rewrite `src/app/globals.css`**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --primary-light: #818cf8;
  --primary-bg: #f5f3ff;
  --secondary: #64748b;
  --success: #10b981;
  --success-bg: #d1fae5;
  --danger: #ef4444;
  --danger-bg: #fee2e2;
  --warning: #f59e0b;
  --warning-bg: #fef3c7;
  --info: #06b6d4;
  --info-bg: #e0f7fa;

  --bg: #f0f4f8;
  --bg-white: #ffffff;

  --text: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-light: #cbd5e1;

  --border: #e2e8f0;
  --border-light: #f1f5f9;

  --sidebar-w: 260px;
  --topbar-h: 64px;
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);
  --color-primary-light: var(--primary-light);
  --color-primary-bg: var(--primary-bg);
  --color-secondary: var(--secondary);
  --color-success: var(--success);
  --color-success-bg: var(--success-bg);
  --color-danger: var(--danger);
  --color-danger-bg: var(--danger-bg);
  --color-warning: var(--warning);
  --color-warning-bg: var(--warning-bg);
  --color-info: var(--info);
  --color-info-bg: var(--info-bg);
  --color-bg: var(--bg);
  --color-bg-white: var(--bg-white);
  --color-text: var(--text);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-light: var(--text-light);
  --color-border-color: var(--border);
  --color-border-light: var(--border-light);
  --font-sans: var(--font-inter);
}

body {
  font-family: var(--font-inter), system-ui, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  font-size: 14px;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background-color: color-mix(in srgb, var(--primary) 30%, transparent);
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--text-light); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

- [ ] **Step 2: Switch font Outfit → Inter in `src/app/layout.tsx`**

Replace the `Outfit` import/usage:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
```

Change `<html lang="fr" className={`${outfit.variable} h-full antialiased`}>` to use `inter.variable`. Everything else in `layout.tsx` stays.

- [ ] **Step 3: Verify**

Run: `npm run lint` — Expected: 0 errors.
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/app/login` — Expected: 200.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "P0: add desktop design tokens + Inter font"
```

---

### Task 2: UI primitives → light theme

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx` (Input + Textarea)
- Modify: `src/components/ui/Select.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Table.tsx`
- Modify: `src/components/ui/Toast.tsx`
- Modify: `src/components/ui/LoadingSpinner.tsx`

**Interfaces:**
- Produces: Light-theme versions of all primitives. Props unchanged (no callers change). Badge color helper `getDocTypeColor` returns `devis → 'yellow'` (desktop amber).

- [ ] **Step 1: `Button.tsx`** — replace `variantClasses`:

```tsx
const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-sm shadow-primary/20',
  secondary: 'bg-white text-text border border-border-color hover:bg-gray-50 hover:border-gray-300',
  danger: 'bg-danger hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-text-secondary',
  outline: 'bg-transparent border border-border-color text-text-secondary hover:bg-gray-50',
}
```

Leave `sizeClasses` and the rest unchanged.

- [ ] **Step 2: `Input.tsx`** — replace `baseClasses` and both label/error classes:

```tsx
const baseClasses =
  'w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50'
```

Label (both Input and Textarea): `className="block text-xs font-semibold text-text-secondary"`. Error: `className="text-xs text-red-600"`. Error border: `border-red-500 focus:ring-red-500` stays.

- [ ] **Step 3: `Select.tsx`** — same treatment: `bg-white border border-border-color rounded-lg text-sm text-text focus:ring-primary`, label `text-xs font-semibold text-text-secondary`, error `text-xs text-red-600`.

- [ ] **Step 4: `Badge.tsx`** — `colorClasses` pastels already match desktop (blue/green/red/yellow/purple/orange/teal/gray). Change only `getDocTypeColor`:

```tsx
export function getDocTypeColor(type: string): BadgeProps['color'] {
  const map: Record<string, BadgeProps['color']> = {
    facture: 'blue',
    devis: 'yellow',
    avoir: 'orange',
    bon: 'green',
    bl: 'teal',
    forfaitaire: 'gray',
  }
  return map[type] || 'gray'
}
```

- [ ] **Step 5: `Card.tsx`** — replace classes:

```tsx
<div className={`bg-white border border-border-color rounded-xl ${className}`}>
  {(title || action) && (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <div>
          <h3 className="text-sm font-bold text-text">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )}
  <div className="p-5">{children}</div>
</div>
```

- [ ] **Step 6: `Modal.tsx`** — replace panel classes:

```tsx
<div className={`relative w-full ${maxWidth} bg-white border border-border-color rounded-2xl shadow-2xl`}>
  <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
    <h3 className="text-base font-semibold text-text">{title}</h3>
    <button
      onClick={onClose}
      className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text"
      aria-label="Fermer"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
  <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
  {footer && <div className="px-5 py-3 border-t border-border-light flex justify-end gap-2">{footer}</div>}
</div>
```

- [ ] **Step 7: `Table.tsx`** — replace thead/row classes:

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-border-color">
        {columns.map((col) => (
          <th
            key={col.key}
            className={`text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-gray-50 ${col.className || ''}`}
          >
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-border-light">
      {rows.length === 0 && (
        <tr>
          <td colSpan={columns.length} className="px-4 py-10 text-center text-text-muted">
            {emptyMessage}
          </td>
        </tr>
      )}
      {rows.map((row, i) => (
        <tr
          key={i}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}
        >
          {columns.map((col) => (
            <td key={col.key} className={`px-4 py-3 text-text ${col.className || ''}`}>
              {col.render(row)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

- [ ] **Step 8: `Toast.tsx`** — desktop-style top-right white cards with colored left borders. Replace the container + item JSX:

```tsx
const borderMap = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-primary',
}
const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <AlertCircle className="h-4 w-4 text-danger" />,
  info: <Info className="h-4 w-4 text-primary" />,
}
// ...
<div className="fixed top-5 right-5 z-[100] space-y-2">
  {toasts.map((t) => (
    <div
      key={t.id}
      className={`flex items-center gap-2.5 bg-white border border-border-color border-l-4 ${borderMap[t.type]} rounded-[10px] px-4 py-3 text-sm text-text shadow-lg max-w-sm`}
    >
      {iconMap[t.type]}
      <span className="flex-1">{t.message}</span>
      <button
        onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        className="text-text-muted hover:text-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  ))}
</div>
```

- [ ] **Step 9: `LoadingSpinner.tsx`** — replace classes: container `text-text-muted`, spinner `text-primary`, label `mt-3 text-sm`.

- [ ] **Step 10: Verify**

Run: `npm run lint` — Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui
git commit -m "P0: restyle UI primitives to light theme"
```

---

### Task 3: App shell (Sidebar + Topbar + AppShell)

**Files:**
- Rewrite: `src/components/layout/Sidebar.tsx`
- Rewrite: `src/components/layout/Topbar.tsx`
- Rewrite: `src/components/layout/AppShell.tsx`

**Interfaces:**
- `Sidebar({ collapsed }: { collapsed: boolean })` — renders desktop nav sections; `soon` items disabled with "Bientôt" badge; logout in footer.
- `Topbar({ onToggleCollapse }: { onToggleCollapse: () => void })` — hamburger, breadcrumb, global search (submits to `/invoices?q=...`), current-date pill, user pill.
- `AppShell({ children })` — owns `collapsed` state, renders `flex min-h-screen` shell. Consumed by `src/app/(app)/layout.tsx` (unchanged).

- [ ] **Step 1: Rewrite `Sidebar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, PlusCircle, FileText, Users, Truck, ShoppingBag, Building2,
  FileSignature, Briefcase, ShoppingCart, Receipt, FileOutput, Wrench,
  CashRegister, StickyNote, History, Settings, LogOut, type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  soon?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/invoices/new', label: 'Nouveau Document', icon: PlusCircle },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/invoices', label: 'Mes Documents', icon: FileText },
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/fournisseurs', label: 'Fournisseurs', icon: Truck, soon: true },
      { href: '/services', label: 'Services & Produits', icon: ShoppingBag },
      { href: '/settings/company', label: 'Mon Entreprise', icon: Building2 },
      { href: '/contracts', label: 'Contrats', icon: FileSignature, soon: true },
      { href: '/hr', label: 'Ressources Humaines', icon: Briefcase, soon: true },
      { href: '/expenses', label: 'Achats & Dépenses', icon: ShoppingCart },
      { href: '/retenues', label: 'Retenue à la Source', icon: Receipt },
      { href: '/export-tej', label: 'TEJ Export', icon: FileOutput, soon: true },
      { href: '/outils', label: 'Outils', icon: Wrench, soon: true },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { href: '/pos', label: 'Point de Vente', icon: CashRegister, soon: true },
    ],
  },
  {
    label: 'Productivité',
    items: [
      { href: '/notes', label: 'Notes', icon: StickyNote, soon: true },
    ],
  },
  {
    label: 'Système',
    items: [
      { href: '/audit-log', label: "Journal d'Activité", icon: History, soon: true },
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
]

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser({ id: user.id, email: user.email || '' })
      setProfileEmail(user.email || '')
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      setProfileName(profile?.name || user.email?.split('@')[0] || '')
    }
    load()
  }, [setUser])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  const initials = (profileName || profileEmail || '?').slice(0, 1).toUpperCase()

  return (
    <aside
      className={`shrink-0 bg-white border-r border-border-color flex flex-col transition-[width] duration-200 overflow-hidden sticky top-0 h-screen ${
        collapsed ? 'w-[60px]' : 'w-[260px]'
      }`}
    >
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-border-color shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white text-base font-extrabold shrink-0">
          F
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-text leading-tight">Factarlou</p>
            <p className="text-[11px] text-text-muted leading-tight">Facturation en ligne</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-border-color bg-gray-50 shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text truncate">{profileName || 'Utilisateur'}</p>
            <p className="text-[11px] text-text-muted truncate">{profileEmail}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-light px-2.5 pt-3 pb-1">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active =
                item.href === '/invoices'
                  ? pathname === '/invoices'
                  : item.href === '/invoices/new'
                    ? pathname === '/invoices/new'
                    : pathname === item.href
              const base = `flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm font-medium mb-0.5 transition-colors cursor-pointer ${
                collapsed ? 'justify-center px-0' : ''
              }`
              if (item.soon) {
                return (
                  <div
                    key={item.href}
                    className={`${base} text-text-muted opacity-70 cursor-not-allowed`}
                    title="Bientôt disponible"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <span className="text-[10px] font-semibold bg-gray-100 text-text-muted px-1.5 py-0.5 rounded-full">
                          Bientôt
                        </span>
                      </>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${base} ${
                    active
                      ? 'bg-primary-bg text-primary font-semibold shadow-[inset_3px_0_0_var(--primary)]'
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-border-color shrink-0 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm font-medium text-text-secondary transition-colors cursor-pointer hover:bg-danger-bg hover:text-danger ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
        {!collapsed && (
          <p className="text-[11px] text-text-muted text-center font-mono opacity-80">Factarlou v1.0 — Web</p>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Rewrite `Topbar.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/invoices': 'Mes Documents',
  '/invoices/new': 'Nouveau Document',
  '/clients': 'Clients',
  '/services': 'Services & Produits',
  '/settings/company': 'Mon Entreprise',
  '/expenses': 'Achats & Dépenses',
  '/retenues': 'Retenue à la Source',
  '/settings': 'Paramètres',
}

export function Topbar({ onToggleCollapse }: { onToggleCollapse: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState('')

  const label =
    pathname?.startsWith('/invoices/') && pathname !== '/invoices' && pathname !== '/invoices/new'
      ? 'Document'
      : (pathname ? breadcrumbs[pathname] : undefined) || 'Factarlou'

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="h-16 shrink-0 bg-white border-b border-border-color flex items-center justify-between px-4 lg:px-6 gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[6px] text-text-secondary hover:bg-gray-100 hover:text-text cursor-pointer"
          title="Réduire / agrandir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-[13px] text-text-muted whitespace-nowrap truncate hidden sm:block">
          Factarlou <span className="text-text font-semibold">/ {label}</span>
        </p>
      </div>

      <form
        className="relative hidden md:block"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(`/invoices?q=${encodeURIComponent(q)}`)
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document..."
          className="w-64 lg:w-80 pl-9 pr-3 py-2 bg-gray-100 border border-border-color rounded-lg text-sm text-text placeholder-text-muted focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </form>

      <div className="flex items-center gap-2.5">
        <span className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary bg-gray-100 border border-border-color">
          {today}
        </span>
        <span className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-gray-100 border border-border-color rounded-full">
          <span className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">F</span>
          <span className="text-sm font-semibold text-text hidden sm:block">Factarlou</span>
        </span>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Rewrite `AppShell.tsx`**

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main className="flex-1 p-5 lg:p-7">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Remove dead topbar code**

`src/app/(app)/layout.tsx` still wraps `<AppShell>`. Confirm no other file imports the old Topbar's `LogOut`/profile logic (it's replaced). Run a grep for `profileName` in `src/components/layout` — only Sidebar should have it.

- [ ] **Step 5: Verify**

Run: `npm run lint` — Expected: 0 errors.
Run: `npm run build` — Expected: success (all routes compile).

- [ ] **Step 6: Commit**

```bash
git add src/components/layout
git commit -m "P0: desktop app shell (sidebar 260px + topbar 64px)"
```

---

### Task 4: Auth screens (desktop gradient + tabs + missing pages)

**Files:**
- Create: `src/components/auth/AuthCard.tsx`
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/confirm-email/page.tsx`
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/auth-code-error/page.tsx`

**Interfaces:**
- `AuthCard({ tabs, children })` — white 440px card with logo, optional tab bar, children. `tabs?: { href: string; label: string }[]`.
- Login/Register push `/confirm-email` when email confirmation is pending.

- [ ] **Step 1: Create `src/components/auth/AuthCard.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface AuthCardProps {
  tabs?: { href: string; label: string }[]
  children: ReactNode
}

export function AuthCard({ tabs, children }: AuthCardProps) {
  const pathname = usePathname()
  return (
    <div className="w-full max-w-[440px] bg-white rounded-[20px] p-10 shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-white text-3xl font-extrabold">
          F
        </div>
        <h1 className="mt-4 text-[1.6rem] font-extrabold text-text tracking-tight">Factarlou</h1>
        <p className="text-sm text-text-muted mt-1">Logiciel de facturation pour les entreprises tunisiennes</p>
      </div>
      {tabs && (
        <div className="flex bg-gray-100 rounded-[10px] p-1 gap-1 mb-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 py-2 text-center rounded-[6px] text-sm font-semibold transition-colors ${
                pathname === t.href ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `(auth)/layout.tsx`**

```tsx
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #4f46e5 50%, #0ea5e9 100%)' }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Restyle `login/page.tsx`**

Replace the returned card (lines 37-81) so the page renders:

```tsx
return (
  <AuthCard
    tabs={[
      { href: '/login', label: 'Connexion' },
      { href: '/register', label: 'Inscription' },
    ]}
  >
    <h2 className="text-lg font-semibold text-text mb-1">Se connecter</h2>
    <p className="text-sm text-text-muted mb-5">Accédez à votre espace de facturation</p>

    <form onSubmit={handleLogin} className="space-y-4">
      {/* unchanged fields: email, password, forgot-password link, submit */}
    </form>

    <p className="mt-5 text-center text-sm text-text-muted">
      Pas encore de compte ?{' '}
      <Link href="/register" className="text-primary hover:text-primary-dark font-medium">
        S&apos;inscrire
      </Link>
    </p>
  </AuthCard>
)
```

Update imports: add `import { AuthCard } from '@/components/auth/AuthCard'`. Change the forgot-password link classes from `text-blue-400 hover:text-blue-300` to `text-primary hover:text-primary-dark`. The form field markup is unchanged (Input/Button components are already light from Task 2). Remove the old `bg-slate-900` card wrapper.

- [ ] **Step 4: Restyle `register/page.tsx`**

Same pattern — wrap the form in `AuthCard` with the same `tabs`. Title `Créer un compte`, subtitle `Commencez à facturer en quelques minutes`. Link `Se connecter` uses `text-primary hover:text-primary-dark`. On the "email confirmation pending" branch (line 67-70), change `router.push('/login')` to `router.push('/confirm-email')`.

- [ ] **Step 5: Create `confirm-email/page.tsx`**

```tsx
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { MailCheck } from 'lucide-react'

export default function ConfirmEmailPage() {
  return (
    <AuthCard>
      <div className="text-center py-2">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-success-bg flex items-center justify-center">
          <MailCheck className="h-7 w-7 text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text mb-1">Vérifiez votre email</h2>
        <p className="text-sm text-text-muted mb-6">
          Un lien de confirmation a été envoyé à votre adresse. Cliquez dessus pour activer votre
          compte, puis connectez-vous.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    </AuthCard>
  )
}
```

- [ ] **Step 6: Create `forgot-password/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast('Veuillez saisir votre email', 'error')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/api/auth/callback?next=/login`,
    })
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    toast('Si cet email existe, un lien de réinitialisation a été envoyé.', 'info')
  }

  return (
    <AuthCard>
      <h2 className="text-lg font-semibold text-text mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-text-muted mb-5">
        Saisissez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="vous@entreprise.tn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Envoyer le lien
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-muted">
        <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  )
}
```

- [ ] **Step 7: Create `auth-code-error/page.tsx`**

```tsx
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <AuthCard>
      <div className="text-center py-2">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-danger-bg flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-danger" />
        </div>
        <h2 className="text-lg font-semibold text-text mb-1">Lien invalide ou expiré</h2>
        <p className="text-sm text-text-muted mb-6">
          Le lien de confirmation n&apos;est plus valide. Veuillez réessayer de vous connecter ou de
          vous inscrire.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    </AuthCard>
  )
}
```

- [ ] **Step 8: Verify**

Run: `npm run lint` — Expected: 0 errors.
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/app/forgot-password http://localhost:3000/app/auth-code-error http://localhost:3000/app/confirm-email` — Expected: `200` `200` `200` (curl with multiple URLs prints each code).

- [ ] **Step 9: Commit**

```bash
git add src/components/auth "src/app/(auth)"
git commit -m "P0: desktop auth screens + forgot-password/confirm/auth-code-error pages"
```

---

### Task 5: API — expense delete route

**Files:**
- Create: `src/app/api/expenses/[id]/route.ts`

**Interfaces:**
- Produces: `DELETE /app/api/expenses/:id` → `200 { ok: true }` or `401`/`500`. Consumed by `expenses/page.tsx` (already calls it).

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint` — Expected: 0 errors.
Run: `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3000/app/api/expenses/00000000-0000-0000-0000-000000000000` — Expected: `401` (route exists, auth-gated).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/expenses/[id]/route.ts"
git commit -m "P0: add expense delete API route"
```

---

### Task 6: Dashboard restyle

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/dashboard/StatCard.tsx`
- Modify: `src/components/dashboard/RecentDocuments.tsx`

**Interfaces:**
- Produces: `StatCard({ title, value, suffix, icon, color })` — color union unchanged. Desktop stat-card markup with hover gradient top bar. Grid `lg:grid-cols-3` (desktop 3-col).

- [ ] **Step 1: Rewrite `StatCard.tsx`**

```tsx
'use client'

import type { ReactNode } from 'react'

export interface StatCardProps {
  title: string
  value: string | number
  suffix?: string
  icon: ReactNode
  color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'teal'
}

const colorMap: Record<StatCardProps['color'], string> = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  orange: 'bg-amber-100 text-amber-600',
  teal: 'bg-teal-100 text-teal-600',
}

export function StatCard({ title, value, suffix, icon, color }: StatCardProps) {
  return (
    <div className="bg-white border border-border-color rounded-[14px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary-light opacity-0 hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text-secondary truncate">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-text tracking-tight truncate">
            {value}
            {suffix && <span className="text-sm font-medium text-text-muted ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Restyle `RecentDocuments.tsx`**

Apply the Task-Global mapping table: `bg-slate-900 border border-slate-800 rounded-xl` → `bg-white border border-border-color rounded-xl`; header `border-b border-slate-800` → `border-b border-border-light`; `text-slate-100` → `text-text`; `text-blue-400 hover:text-blue-300` → `text-primary hover:text-primary-dark`; th `text-slate-500` → `text-text-muted`; `divide-slate-800/60` → `divide-border-light`; `hover:bg-slate-800/30` → `hover:bg-gray-50`; `text-slate-300` → `text-text-secondary`; `text-slate-400` → `text-text-muted`; `text-slate-200` → `text-text`; `text-blue-400` (N°) → `text-primary`. The A4/white PDF colors are untouched.

- [ ] **Step 3: Restyle `dashboard/page.tsx`**

- Heading: `text-xl font-extrabold text-slate-100` → `text-2xl font-bold text-text`; subtitle `text-sm text-slate-500` → `text-sm text-text-muted`.
- Stat grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` (desktop 3-col).
- Buttons unchanged.

- [ ] **Step 4: Verify**

Run: `npm run lint` — Expected: 0 errors.
Run: `npm run build` — Expected: success.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx" src/components/dashboard
git commit -m "P0: restyle dashboard to desktop stats grid"
```

---

### Task 7: Invoices module restyle

**Files (apply the Task-Global dark→light mapping table to each):**
- `src/app/(app)/invoices/page.tsx`
- `src/components/invoices/InvoiceForm.tsx`
- `src/components/invoices/LineItems.tsx`
- `src/components/invoices/TotalsPanel.tsx`
- `src/components/invoices/ClientSelector.tsx`
- `src/app/(app)/invoices/[id]/page.tsx`
- `src/components/pdf/InvoicePDF.tsx` (outer wrapper card only — the A4 preview stays white)
- `src/components/pdf/RetenuePDF.tsx` (outer wrapper card only)

**Notes:**
- Do NOT change `DOC_TYPES` in `invoices/page.tsx` (doc-type set is aligned in P1).
- `invoices/new/page.tsx` is a server wrapper — verify it has no dark classes; if none, skip.
- Heading pattern: `text-xl font-extrabold text-slate-100` → `text-2xl font-bold text-text`; subtitles `text-slate-500` → `text-text-muted`.
- Card wrappers `bg-slate-900 border border-slate-800 rounded-xl` → `bg-white border border-border-color rounded-xl`; table headers `border-slate-800` → `border-border-light`.
- Action icon buttons: `text-slate-400 hover:bg-slate-800 hover:text-blue-400` → `text-text-muted hover:bg-gray-100 hover:text-primary`; delete variant `hover:text-red-400` → `hover:text-danger`.
- Modal confirm text `text-slate-300` → `text-text-secondary`, `text-slate-100` strong → `text-text`.
- `InvoicePDF.tsx` / `RetenuePDF.tsx`: only the outer chrome card (the `bg-slate-900 border border-slate-800 rounded-xl overflow-hidden` div and its header border) → light. The inner white A4 `print` area stays.

- [ ] **Step 1: Apply the mapping to all listed files**

- [ ] **Step 2: Verify — no dark classes remain**

Run: `grep -rn "bg-slate-900\|bg-slate-800\|text-slate-100\|text-slate-200\|text-slate-300\|border-slate-800" src/app/'(app)'/invoices src/components/invoices src/components/pdf` — Expected: no matches (except inside the A4 preview markup if any remains intentionally; review each hit).

Run: `npm run lint` — Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/'(app)'/invoices src/components/invoices src/components/pdf
git commit -m "P0: restyle invoices module to light theme"
```

---

### Task 8: Relations + finance pages restyle

**Files (apply the Task-Global mapping table to each):**
- `src/app/(app)/clients/page.tsx`
- `src/app/(app)/services/page.tsx`
- `src/app/(app)/retenues/page.tsx`
- `src/app/(app)/retenues/new/page.tsx`
- `src/app/(app)/retenues/[id]/page.tsx`
- `src/app/(app)/expenses/page.tsx`

**Notes:** Same patterns as Task 7. Heading `text-xl font-extrabold text-slate-100` → `text-2xl font-bold text-text`. Card wrappers → `bg-white border border-border-color rounded-xl`. Table th `text-slate-500` → `text-text-muted`. Rows `hover:bg-slate-800/30` → `hover:bg-gray-50`. Numeric `text-slate-300` → `text-text-secondary`, values `text-slate-200` → `text-text`. Modal copy `text-slate-300` → `text-text-secondary`, strong `text-slate-100` → `text-text`. Action buttons per Task 7 pattern. `text-red-400` (low stock) → `text-red-600`. Inputs in the retenue forms use `Input`/`Select` components (already light); inline raw input classes (e.g. `bg-slate-800 border-slate-600`) → `bg-white border-border-color`.

- [ ] **Step 1: Apply the mapping to all listed files**

- [ ] **Step 2: Verify**

Run: `grep -rn "bg-slate-900\|bg-slate-800\|text-slate-100\|border-slate-800" src/app/'(app)'/clients src/app/'(app)'/services src/app/'(app)'/retenues src/app/'(app)'/expenses` — Expected: no matches.

Run: `npm run lint` — Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/'(app)'/clients src/app/'(app)'/services src/app/'(app)'/retenues src/app/'(app)'/expenses
git commit -m "P0: restyle clients/services/retenues/expenses to light theme"
```

---

### Task 9: Settings module restyle

**Files (apply the Task-Global mapping table):**
- `src/app/(app)/settings/layout.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/app/(app)/settings/company/page.tsx`
- `src/app/(app)/settings/email/page.tsx`

**Notes:** Tab bar in `layout.tsx`: `border-b border-slate-800` → `border-b border-border-color`; active `text-blue-400 border-blue-500` → `text-primary border-primary`; inactive `text-slate-400 hover:text-slate-200` → `text-text-muted hover:text-text`. Heading → `text-2xl font-bold text-text`, subtitle → `text-text-muted`. Card wrappers/inputs per mapping.

- [ ] **Step 1: Apply the mapping to all listed files**

- [ ] **Step 2: Verify**

Run: `grep -rn "bg-slate-900\|bg-slate-800\|text-slate-100\|border-slate-800" src/app/'(app)'/settings` — Expected: no matches.

Run: `npm run lint` — Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/'(app)'/settings
git commit -m "P0: restyle settings module to light theme"
```

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Lint + build**

Run: `npm run lint` — Expected: 0 errors.
Run: `npm run build` — Expected: success, all routes compile.

- [ ] **Step 2: Grep sweep for leftover dark theme classes**

Run: `grep -rn "bg-slate-900\|bg-slate-950\|text-slate-100\|border-slate-800\|bg-blue-600\b" src` — Review every match. Allowed: none in pages/components (the A4 PDF previews must remain white — if a match is inside `InvoicePDF.tsx`/`RetenuePDF.tsx` A4 markup, evaluate whether it's the print area vs the chrome card).

- [ ] **Step 3: Manual walkthrough (browser, logged-in)**

Check at `http://localhost:3000/app/login` → login → then:
1. Sidebar: desktop sections visible, active item indigo with inset bar, collapse via hamburger → 60px icons-only, logout in footer works.
2. Topbar: breadcrumb updates per page, search navigates to `/invoices?q=...`, date pill in French.
3. Dashboard: 3-col stat cards with hover top-bar, light table, white cards.
4. Invoices list + new document + detail: light inputs/cards/tables, PDF preview still prints clean A4.
5. Clients, Services, Retenues, Dépenses: light theme, no dark panels.
6. Settings + tabs: light theme, tab active indigo.
7. Auth pages: gradient background, white card, tabs work, `/forgot-password`, `/confirm-email`, `/auth-code-error` render.
8. Expense delete: opens confirm modal, deleting returns success toast (route exists now).

- [ ] **Step 4: Commit any walkthrough fixes** (as a `fix:` commit if issues were found and fixed)

```bash
git add -A
git commit -m "P0: final verification fixes"
```
(Only if Step 3 produced fixes.)

- [ ] **Step 5: Report**

Summarize: tokens applied, shell rebuilt, auth restyled, 3 missing pages created, expense delete route added, all pages light, lint+build green.
