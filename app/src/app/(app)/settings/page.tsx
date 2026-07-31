'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import type { UserSettings } from '@/types'
import {
  DocumentThemeEditor,
  DocumentDesignSettings,
  DEFAULT_DOCUMENT_DESIGN,
} from '@/components/settings/DocumentThemeEditor'

const PREFIX_FIELDS: Array<{ key: keyof UserSettings; label: string }> = [
  { key: 'prefix_facture', label: 'Factures' },
  { key: 'prefix_devis', label: 'Devis' },
  { key: 'prefix_bon', label: 'Bons de commande' },
  { key: 'prefix_retenue', label: 'Retenues' },
  { key: 'prefix_avoir', label: 'Avoirs' },
  { key: 'prefix_contract', label: 'Contrats' },
  { key: 'prefix_bl', label: 'BL' },
  { key: 'prefix_ba', label: 'BA' },
  { key: 'prefix_bs', label: 'BS' },
  { key: 'prefix_be', label: 'BE' },
  { key: 'prefix_ticket', label: 'Tickets' },
]

function parseDesignTheme(rawTheme?: string | null): DocumentDesignSettings {
  if (!rawTheme) return DEFAULT_DOCUMENT_DESIGN
  try {
    const parsed = JSON.parse(rawTheme)
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_DOCUMENT_DESIGN, ...parsed }
    }
  } catch {
    // fallback if rawTheme is a plain color string
    if (typeof rawTheme === 'string' && rawTheme.startsWith('#')) {
      return { ...DEFAULT_DOCUMENT_DESIGN, primaryColor: rawTheme }
    }
  }
  return DEFAULT_DOCUMENT_DESIGN
}

export default function DocumentSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [designSettings, setDesignSettings] = useState<DocumentDesignSettings>(DEFAULT_DOCUMENT_DESIGN)

  const load = useCallback(async () => {
    const res = await fetch('/app/api/settings')
    if (res.ok) {
      const json = await res.json()
      const s = json.data as UserSettings
      setSettings(s)
      if (s) {
        setDesignSettings(parseDesignTheme(s.document_theme))
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const update = (patch: Partial<UserSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const handleDesignChange = (updated: DocumentDesignSettings) => {
    setDesignSettings(updated)
    update({ document_theme: JSON.stringify(updated) })
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const payload = {
      ...settings,
      document_theme: JSON.stringify(designSettings),
    }
    const res = await fetch('/app/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      toast('Paramètres et design des documents enregistrés avec succès')
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur lors de la sauvegarde', 'error')
    }
  }

  if (loading || !settings) {
    return <div className="py-12 text-center text-text-muted">Chargement...</div>
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Design Customization Section */}
      <div className="bg-white border border-border-color rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-text">Personnalisation & Design des Documents (Factures, Devis...)</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Personnalisez les couleurs, polices, en-têtes et mentions avant d&apos;exporter vos documents en PDF
          </p>
        </div>

        <DocumentThemeEditor value={designSettings} onChange={handleDesignChange} />
      </div>

      {/* Prefix numbering section */}
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text">Préfixes de numérotation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PREFIX_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              value={String(settings[f.key] ?? '')}
              onChange={(e) => update({ [f.key]: e.target.value } as Partial<UserSettings>)}
            />
          ))}
        </div>
      </div>

      {/* Calculations section */}
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text">Calculs & Arrondis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Décimales"
            value={String(settings.decimal_places)}
            onChange={(e) => update({ decimal_places: Number(e.target.value) })}
          >
            {[0, 1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select
            label="Méthode d'arrondi"
            value={settings.rounding_method}
            onChange={(e) => update({ rounding_method: e.target.value as UserSettings['rounding_method'] })}
          >
            <option value="half_up">Demi-arrondi (standard)</option>
            <option value="ceil">Arrondi supérieur</option>
            <option value="floor">Arrondi inférieur</option>
          </Select>
          <Select
            label="Devise par défaut"
            value={settings.currency_default}
            onChange={(e) => update({ currency_default: e.target.value as UserSettings['currency_default'] })}
          >
            <option value="TND">TND</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} loading={saving} size="lg" className="px-8 font-semibold">
          Enregistrer tous les paramètres
        </Button>
      </div>
    </div>
  )
}
