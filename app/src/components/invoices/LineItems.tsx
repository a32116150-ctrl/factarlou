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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text">Lignes du document</h3>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left px-2 py-2 text-xs font-medium text-text-muted w-[35%]">Description</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-text-muted w-20">Qté</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-text-muted w-28">Unité</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-text-muted w-28">Prix HT</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-text-muted w-20">TVA %</th>
              <th className="text-right px-2 py-2 text-xs font-medium text-text-muted w-28">Total HT</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-text-muted">
                  Aucune ligne. Cliquez sur &quot;Ajouter une ligne&quot;.
                </td>
              </tr>
            )}
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-1.5">
                  <input
                    value={item.description}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="Description..."
                    className="w-full px-2.5 py-1.5 bg-white border border-border-color rounded-md text-sm text-text placeholder-text-light focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={item.quantity || ''}
                    onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-1.5">
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
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.price || ''}
                    onChange={(e) => update(i, { price: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-border-color rounded-md text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-2 py-1.5">
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
                <td className="px-2 py-1.5 text-right font-medium text-text">
                  {formatAmount(item.quantity * item.price)}
                </td>
                <td className="px-1 py-1.5">
                  <button
                    onClick={() => remove(i)}
                    className="p-1.5 rounded-md text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
