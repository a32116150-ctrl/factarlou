'use client'

import { calculateTotals, type InvoiceItem } from '@/lib/math-utils'
import { formatAmount } from '@/lib/math-utils'

interface TotalsPanelProps {
  items: InvoiceItem[]
  applyTimbre: boolean
  discountPercent: number
  discountAmount: number
  decimalPlaces: number
  roundingMethod: 'half_up' | 'ceil' | 'floor'
  currency: string
  forfaitaire: boolean
}

export function TotalsPanel({
  items,
  applyTimbre,
  discountPercent,
  discountAmount,
  decimalPlaces,
  roundingMethod,
  currency,
  forfaitaire,
}: TotalsPanelProps) {
  const totals = calculateTotals(items, {
    applyTimbre: applyTimbre && !forfaitaire,
    discountPercent,
    discountAmount,
    decimalPlaces,
    roundingMethod,
  })

  const row = (label: string, value: number, bold = false, muted = false) => (
    <div className={`flex justify-between items-center ${bold ? 'pt-2 border-t border-border-color' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-text' : muted ? 'text-text-muted' : 'text-text-muted'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-extrabold text-text text-base' : 'text-text'}`}>
        {formatAmount(value, decimalPlaces)} {currency}
      </span>
    </div>
  )

  return (
    <div className="space-y-2.5 bg-gray-50 border border-border-color rounded-xl p-4">
      {totals.tvaLines.length > 0 && (
        <div className="space-y-1.5">
          {totals.tvaLines.map((line) => (
            <div key={line.rate} className="flex justify-between text-xs text-text-muted">
              <span>Base HT {line.rate}%</span>
              <span>{formatAmount(line.baseHT, decimalPlaces)} {currency}</span>
              <span>TVA {line.rate}%</span>
              <span>{formatAmount(line.tvaAmount, decimalPlaces)} {currency}</span>
            </div>
          ))}
        </div>
      )}
      {row('Total HT', totals.totalHT)}
      {totals.discountAmount > 0 && row(`Remise`, -totals.discountAmount, false, true)}
      {!forfaitaire && totals.tvaLines.length > 0 && row('Total TVA', totals.totalTVA)}
      {applyTimbre && !forfaitaire && row('Droit de timbre (0.600 TND)', totals.timbreAmount, false, true)}
      {row('Total TTC', totals.totalTTC, true)}
    </div>
  )
}
