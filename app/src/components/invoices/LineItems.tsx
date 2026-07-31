'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { TVARate } from '@/lib/math-utils'
import { formatAmount } from '@/lib/math-utils'

export interface LineItemDraft {
  description: string
  quantity: number
  price: number
  tva: TVARate
  unit: string
}

interface LineItemsProps {
  items: LineItemDraft[]
  forfaitaire: boolean
  onChange: (items: LineItemDraft[]) => void
}

const UNITS = ['unité', 'heure', 'kg', 'm', 'm²', 'm³', 'forfait']

export function LineItems({ items, forfaitaire, onChange }: LineItemsProps) {
  const update = (i: number, patch: Partial<LineItemDraft>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    onChange(next)
  }

  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i))
  }

  const add = () => {
    onChange([...items, { description: '', quantity: 1, price: 0, tva: 19, unit: 'unité' }])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">Lignes du document</h3>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" /> Ajouter une ligne
        </button>
      </div>

      {items.length === 0 && (
        <div className="px-4 py-8 text-center text-text-muted bg-gray-50 border border-border-color rounded-xl text-sm">
          Aucune ligne. Cliquez sur &quot;Ajouter une ligne&quot;.
        </div>
      )}

      {/* MOBILE CARD VIEW (< 768px) */}
      <div className="space-y-3 block md:hidden">
        {items.map((item, i) => (
          <div key={i} className="p-3.5 bg-white border border-border-color rounded-xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border-light pb-2">
              <span className="text-xs font-bold text-text-muted uppercase">Ligne #{i + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">
                  {formatAmount(item.quantity * item.price)} TND
                </span>
                <button
                  onClick={() => remove(i)}
                  className="p-1 rounded-md text-danger hover:bg-danger-bg cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">Désignation / Service</label>
              <input
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Description..."
                className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Qté</label>
                <input
                  type="number"
                  min={0.001}
                  step="any"
                  value={item.quantity || ''}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Unité</label>
                <select
                  value={item.unit}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Prix HT (TND)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.price || ''}
                  onChange={(e) => update(i, { price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">TVA (%)</label>
                <select
                  value={forfaitaire ? 0 : item.tva}
                  disabled={forfaitaire}
                  onChange={(e) => update(i, { tva: Number(e.target.value) as TVARate })}
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {[19, 13, 7, 0].map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block overflow-x-auto border border-border-color rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-gray-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-muted">Description</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-muted w-24">Qté</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-muted w-28">Unité</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-muted w-32">Prix HT</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-muted w-24">TVA %</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-text-muted w-32">Total HT</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light bg-white">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-2">
                  <input
                    value={item.description}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="Description..."
                    className="w-full px-2.5 py-1.5 bg-white border border-border-color rounded-md text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={item.quantity || ''}
                    onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={item.unit}
                    onChange={(e) => update(i, { unit: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.price || ''}
                    onChange={(e) => update(i, { price: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={forfaitaire ? 0 : item.tva}
                    disabled={forfaitaire}
                    onChange={(e) => update(i, { tva: Number(e.target.value) as TVARate })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    {[19, 13, 7, 0].map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-text">
                  {formatAmount(item.quantity * item.price)}
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => remove(i)}
                    className="p-1.5 rounded-md text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
