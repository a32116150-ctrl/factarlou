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
