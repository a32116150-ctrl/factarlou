'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { Client } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface ClientSelectorProps {
  value: Client | null
  onChange: (client: Client | null) => void
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      let queryBuilder = supabase.from('clients').select('*').order('name').limit(20)
      if (query) queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,mf.ilike.%${query}%`)
      const { data } = await queryBuilder
      if (!cancelled) {
        setClients(data || [])
        setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query])

  return (
    <div ref={rootRef} className="relative">
      {value ? (
        <div className="flex items-center justify-between bg-white border border-border-color rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text">{value.name}</p>
            <p className="text-xs text-text-muted">
              {[value.mf, value.email].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <button
            onClick={() => onChange(null)}
            className="text-xs text-text-muted hover:text-danger cursor-pointer"
          >
            Retirer
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left bg-white border border-border-color rounded-lg px-3 py-2 text-sm text-text-muted hover:border-text-muted cursor-pointer"
        >
          Rechercher un client...
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-border-color rounded-xl shadow-2xl">
          <div className="relative p-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, MF, email..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading && <p className="px-3 py-4 text-center text-xs text-text-muted">Recherche...</p>}
            {!loading && clients.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-text-muted">Aucun client trouvé</p>
            )}
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                  setQuery('')
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-100 cursor-pointer"
              >
                <p className="text-sm font-medium text-text">{c.name}</p>
                <p className="text-xs text-text-muted">
                  {[c.mf, c.email].filter(Boolean).join(' · ') || '—'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
