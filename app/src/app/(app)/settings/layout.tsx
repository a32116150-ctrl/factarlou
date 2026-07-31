'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/settings', label: 'Documents' },
  { href: '/settings/company', label: 'Entreprise' },
  { href: '/settings/email', label: 'Email' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text">Paramètres</h1>
        <p className="text-sm text-text-muted">Configurez votre entreprise et vos préférences</p>
      </div>
      <div className="flex gap-1 border-b border-border-color">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              pathname === l.href
                ? 'text-primary border-primary'
                : 'text-text-muted border-transparent hover:text-text'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
