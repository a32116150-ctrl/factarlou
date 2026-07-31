'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import type { UserSettings } from '@/types'

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

export default function DocumentSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/app/api/settings')
    if (res.ok) {
      const json = await res.json()
      setSettings(json.data)
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

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const res = await fetch('/app/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) {
      toast('Paramètres enregistrés')
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur', 'error')
    }
  }

  if (loading || !settings) {
    return <div className="py-12 text-center text-text-muted">Chargement...</div>
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Préfixes de numérotation</h2>
        <div className="grid grid-cols-2 gap-3">
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

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Calculs</h2>
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
            <option value="half_up">Demi-arondi (standard)</option>
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

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}
