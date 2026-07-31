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

export function Topbar({
  onToggleCollapse,
  onOpenMobile,
}: {
  onToggleCollapse: () => void
  onOpenMobile?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState('')

  const label =
    pathname?.startsWith('/invoices/') && pathname !== '/invoices' && pathname !== '/invoices/new'
      ? 'Document'
      : (pathname ? breadcrumbs[pathname] : undefined) || 'Factarlou'

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())

  return (
    <header className="h-16 shrink-0 bg-white border-b border-border-color flex items-center justify-between px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text cursor-pointer lg:hidden"
          title="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-[6px] text-text-secondary hover:bg-gray-100 hover:text-text cursor-pointer"
          title="Réduire / agrandir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <p className="text-xs sm:text-[13px] text-text-muted whitespace-nowrap truncate">
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
          className="w-48 lg:w-80 pl-9 pr-3 py-1.5 bg-gray-100 border border-border-color rounded-lg text-xs sm:text-sm text-text placeholder-text-muted focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </form>

      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary bg-gray-100 border border-border-color">
          {today}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-border-color rounded-full">
          <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">F</span>
          <span className="text-xs font-semibold text-text hidden xs:inline">Factarlou</span>
        </span>
      </div>
    </header>
  )
}
