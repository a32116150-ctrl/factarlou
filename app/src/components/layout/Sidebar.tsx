'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CirclePlus, FileText, Users, Truck, ShoppingBag, Building2,
  FilePenLine, Briefcase, ShoppingCart, Receipt, FileOutput, Wrench,
  ScanBarcode, StickyNote, Clock3, Settings, LogOut, X, type LucideIcon,
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
      { href: '/invoices/new', label: 'Nouveau Document', icon: CirclePlus },
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
      { href: '/contracts', label: 'Contrats', icon: FilePenLine, soon: true },
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
      { href: '/pos', label: 'Point de Vente', icon: ScanBarcode, soon: true },
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
      { href: '/audit-log', label: "Journal d'Activité", icon: Clock3, soon: true },
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
]

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
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
    if (onCloseMobile) onCloseMobile()
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  const initials = (profileName || profileEmail || '?').slice(0, 1).toUpperCase()

  return (
    <aside
      className={`shrink-0 bg-white border-r border-border-color flex flex-col transition-all duration-200 overflow-hidden z-50
        fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:h-screen
        ${mobileOpen ? 'translate-x-0 w-[260px] shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-[60px]' : 'lg:w-[260px]'}
      `}
    >
      <div className="h-16 px-5 flex items-center justify-between border-b border-border-color shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white text-base font-extrabold shrink-0">
            F
          </div>
          {(!collapsed || mobileOpen) && (
            <div>
              <p className="text-sm font-bold text-text leading-tight">Factarlou</p>
              <p className="text-[11px] text-text-muted leading-tight">Facturation en ligne</p>
            </div>
          )}
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 rounded-lg text-text-muted hover:bg-gray-100 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-border-color bg-gray-50 shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initials}
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text truncate">{profileName || 'Utilisateur'}</p>
            <p className="text-[11px] text-text-muted truncate">{profileEmail}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {(!collapsed || mobileOpen) && (
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
              const isCollapsedDesktop = collapsed && !mobileOpen
              const base = `flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm font-medium mb-0.5 transition-colors cursor-pointer ${
                isCollapsedDesktop ? 'justify-center px-0' : ''
              }`
              if (item.soon) {
                return (
                  <div
                    key={item.href}
                    className={`${base} text-text-muted opacity-70 cursor-not-allowed`}
                    title="Bientôt disponible"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!isCollapsedDesktop && (
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
                  onClick={onCloseMobile}
                  className={`${base} ${
                    active
                      ? 'bg-primary-bg text-primary font-semibold shadow-[inset_3px_0_0_var(--primary)]'
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!isCollapsedDesktop && <span className="flex-1 text-left">{item.label}</span>}
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
            collapsed && !mobileOpen ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {(!collapsed || mobileOpen) && <span>Se déconnecter</span>}
        </button>
        {(!collapsed || mobileOpen) && (
          <p className="text-[11px] text-text-muted text-center font-mono opacity-80">Factarlou v1.0 — Web</p>
        )}
      </div>
    </aside>
  )
}
