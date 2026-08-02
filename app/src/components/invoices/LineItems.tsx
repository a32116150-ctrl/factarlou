'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { InvoiceItem, TVARate } from '@/lib/math-utils'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/formatters'

interface LineItemsProps {
  items: InvoiceItem[]
  forfaitaire?: boolean
  onChange: (items: InvoiceItem[]) => void
}

const UNITS = ['unité', 'heure', 'jour', 'mois', 'forfait', 'kg', 'mètres', 'service', 'lot']

const defaultStyle = { backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' as const }

export function LineItems({ items, forfaitaire = false, onChange }: LineItemsProps) {
  const update = (index: number, partial: Partial<InvoiceItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...partial }
    onChange(next)
  }

  const addLine = () => {
    onChange([
      ...items,
      { description: '', quantity: 1, unit: 'unité', price: 0, tva: forfaitaire ? 0 : 19 },
    ])
  }

  const removeLine = (index: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">Lignes du document</h3>
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
        </Button>
      </div>

      {/* MOBILE CARDS VIEW (< 768px) */}
      <div className="block md:hidden space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-border-color rounded-xl p-3 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-1 border-b border-border-light">
              <span className="text-xs font-bold text-text-muted">Ligne {i + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-primary">
                  {formatNumber(item.quantity * item.price)} TND
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={items.length <= 1}
                  className="p-1 rounded text-red-500 hover:bg-red-50 disabled:opacity-30"
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
                style={defaultStyle}
                className="w-full px-3 py-2 border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
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
                  style={defaultStyle}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Unité</label>
                <select
                  value={item.unit}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  style={defaultStyle}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
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
                  style={defaultStyle}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">TVA (%)</label>
                <select
                  value={forfaitaire ? 0 : item.tva}
                  disabled={forfaitaire}
                  onChange={(e) => update(i, { tva: Number(e.target.value) as TVARate })}
                  style={defaultStyle}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
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
                    style={defaultStyle}
                    className="w-full px-2.5 py-1.5 border border-border-color rounded-md text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={item.quantity || ''}
                    onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                    style={defaultStyle}
                    className="w-full px-2 py-1.5 border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={item.unit}
                    onChange={(e) => update(i, { unit: e.target.value })}
                    style={defaultStyle}
                    className="w-full px-2 py-1.5 border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
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
                    style={defaultStyle}
                    className="w-full px-2 py-1.5 border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={forfaitaire ? 0 : item.tva}
                    disabled={forfaitaire}
                    onChange={(e) => update(i, { tva: Number(e.target.value) as TVARate })}
                    style={defaultStyle}
                    className="w-full px-2 py-1.5 border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    {[19, 13, 7, 0].map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right font-medium text-text">
                  {formatNumber(item.quantity * item.price)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={items.length <= 1}
                    className="p-1 rounded text-red-500 hover:bg-red-50 disabled:opacity-30"
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
