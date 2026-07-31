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
