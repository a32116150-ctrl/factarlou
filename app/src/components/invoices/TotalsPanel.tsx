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
    <div className={`flex justify-between items-center ${bold ? 'pt-2.5 border-t border-border-color' : ''}`}>
      <span className={`text-xs sm:text-sm ${bold ? 'font-bold text-text' : muted ? 'text-text-muted' : 'text-text-secondary'}`}>
        {label}
      </span>
      <span className={`text-xs sm:text-sm ${bold ? 'font-extrabold text-primary text-base sm:text-lg' : 'text-text font-medium'}`}>
        {formatAmount(value, decimalPlaces)} {currency}
      </span>
    </div>
  )

  return (
    <div className="space-y-3 bg-gray-50 border border-border-color rounded-xl p-3.5 sm:p-4">
      {totals.tvaLines.length > 0 && (
        <div className="space-y-2 border-b border-border-light pb-2">
          {totals.tvaLines.map((line) => (
            <div key={line.rate} className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <div>Base HT {line.rate}%: <strong className="text-text">{formatAmount(line.baseHT, decimalPlaces)} {currency}</strong></div>
              <div className="text-right">TVA {line.rate}%: <strong className="text-text">{formatAmount(line.tvaAmount, decimalPlaces)} {currency}</strong></div>
            </div>
          ))}
        </div>
      )}
      {row('Total HT', totals.totalHT)}
      {totals.discountAmount > 0 && row('Remise', -totals.discountAmount, false, true)}
      {!forfaitaire && totals.tvaLines.length > 0 && row('Total TVA', totals.totalTVA)}
      {applyTimbre && !forfaitaire && row('Droit de timbre (0.600 TND)', totals.timbreAmount, false, true)}
      {row('Total TTC', totals.totalTTC, true)}
    </div>
  )
}
