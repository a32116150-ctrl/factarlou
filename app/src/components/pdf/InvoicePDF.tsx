'use client'

import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Document } from '@/types'
import { formatDate, formatNumber, DOC_TYPE_LABELS } from '@/lib/formatters'

interface InvoicePDFProps {
  doc: Document
}

function tryParseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString)
  } catch {
    return []
  }
}

export function InvoicePDF({ doc }: InvoicePDFProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const rawItems = typeof doc.items_json === 'string' ? (tryParseJSON(doc.items_json) || []) : (doc.items_json || [])
  const items = Array.isArray(rawItems) ? rawItems : []
  const decimals = 3

  const print = () => {
    const content = contentRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${doc.type.toUpperCase()} ${doc.number}</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
            body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; color: #000; margin: 0; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 16px; }
            .invoice-header h1 { font-size: 28px; color: #1e3a8a; margin: 0 0 4px 0; }
            .company-block { text-align: right; font-size: 12px; }
            .company-name { font-weight: bold; font-size: 14px; }
            .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
            .party h3 { font-size: 11px; text-transform: uppercase; color: #555; margin: 0 0 4px 0; }
            .party p { margin: 0; line-height: 1.5; }
            .meta { display: flex; gap: 24px; margin-bottom: 16px; font-size: 12px; }
            .meta div { flex: 1; }
            .meta strong { display: block; font-size: 11px; color: #555; text-transform: uppercase; }
            table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            table.items th, table.items td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            table.items th { background: #f0f0f0; font-size: 11px; text-transform: uppercase; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .totals { width: 280px; margin-left: auto; }
            .totals table { width: 100%; border-collapse: collapse; }
            .totals td { padding: 4px 8px; }
            .totals .grand { font-weight: bold; font-size: 14px; border-top: 2px solid #000; }
            .footer { margin-top: 32px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 12px; }
            .notes { margin-top: 16px; font-size: 12px; }
            .images { display: flex; gap: 16px; margin-top: 24px; align-items: flex-end; }
            .images img { max-height: 90px; max-width: 180px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const tvaLines: Array<{ rate: number; base: number; amount: number }> = []
  items.forEach((it) => {
    const existing = tvaLines.find((l) => l.rate === it.tva)
    const ht = (it.quantity || 0) * (it.price || 0)
    if (existing) {
      existing.base += ht
      existing.amount += (ht * it.tva) / 100
    } else {
      tvaLines.push({ rate: it.tva, base: ht, amount: (ht * it.tva) / 100 })
    }
  })
  tvaLines.sort((a, b) => b.rate - a.rate)

  const titleText = DOC_TYPE_LABELS[doc.type] || doc.type

  return (
    <div className="bg-white border border-border-color rounded-xl overflow-hidden">
      <div className="flex justify-end px-4 py-3 border-b border-border-light">
        <Button size="sm" onClick={print}><Printer className="h-4 w-4" /> Imprimer / PDF</Button>
      </div>
      <div className="p-6 bg-white">
        <div ref={contentRef} className="max-w-[210mm] mx-auto text-black">
          <div className="invoice-header">
            <div>
              <h1 style={{ fontSize: 28, color: '#1e3a8a', fontWeight: 800 }}>{titleText.toUpperCase()}</h1>
              <p>N° {doc.number}</p>
              <p>Date : {formatDate(doc.date)}</p>
              {doc.due_date && <p>Échéance : {formatDate(doc.due_date)}</p>}
            </div>
            <div className="company-block" style={{ textAlign: 'right' }}>
              <p className="company-name">{doc.company_name || ''}</p>
              {doc.company_address && <p>{doc.company_address}</p>}
              {doc.company_mf && <p>MF : {doc.company_mf}</p>}
              {doc.company_rc && <p>RC : {doc.company_rc}</p>}
              {doc.company_phone && <p>Tél : {doc.company_phone}</p>}
              {doc.company_email && <p>{doc.company_email}</p>}
            </div>
          </div>

          <div className="parties">
            <div className="party">
              <h3>Facturé à</h3>
              <p><strong>{doc.client_name}</strong></p>
              {doc.client_mf && <p>MF : {doc.client_mf}</p>}
              {doc.client_address && <p>{doc.client_address}</p>}
              {doc.client_phone && <p>{doc.client_phone}</p>}
              {doc.client_email && <p>{doc.client_email}</p>}
            </div>
            <div className="party" style={{ textAlign: 'right' }}>
              <h3>Informations</h3>
              <p>Mode de paiement : {doc.payment_mode || '—'}</p>
              <p>Devise : {doc.currency}</p>
              {doc.payment_status && <p>Statut : {doc.payment_status}</p>}
            </div>
          </div>

          <table className="items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Unité</th>
                <th className="text-right">Qté</th>
                <th className="text-right">Prix HT</th>
                <th className="text-right">TVA %</th>
                <th className="text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i: number) => (
                <tr key={i}>
                  <td>{it.description}</td>
                  <td>{it.unit || '—'}</td>
                  <td className="text-right">{it.quantity}</td>
                  <td className="text-right">{formatNumber(it.price, decimals)}</td>
                  <td className="text-right">{it.tva}%</td>
                  <td className="text-right">{formatNumber((it.quantity || 0) * (it.price || 0), decimals)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <table>
              <tbody>
                {tvaLines.map((l) => (
                  <tr key={l.rate}>
                    <td>Base HT {l.rate}%</td>
                    <td className="text-right">{formatNumber(l.base, decimals)}</td>
                    <td>TVA {l.rate}%</td>
                    <td className="text-right">{formatNumber(l.amount, decimals)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>Total HT</td>
                  <td className="text-right">{formatNumber(doc.total_ht, decimals)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>Total TVA</td>
                  <td className="text-right">{formatNumber(doc.total_tva, decimals)}</td>
                </tr>
                {doc.timbre_amount > 0 && (
                  <tr>
                    <td colSpan={3}>Droit de timbre</td>
                    <td className="text-right">{formatNumber(doc.timbre_amount, decimals)}</td>
                  </tr>
                )}
                {doc.discount_amount > 0 && (
                  <tr>
                    <td colSpan={3}>Remise</td>
                    <td className="text-right">-{formatNumber(doc.discount_amount, decimals)}</td>
                  </tr>
                )}
                <tr className="grand">
                  <td colSpan={3}>Total TTC</td>
                  <td className="text-right">{formatNumber(doc.total_ttc, decimals)} {doc.currency}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {doc.notes && (
            <div className="notes">
              <strong>Notes :</strong>
              <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0 0' }}>{doc.notes}</p>
            </div>
          )}

          <div className="images">
            {doc.signature_image && <img src={doc.signature_image} alt="Signature" />}
            {doc.stamp_image && <img src={doc.stamp_image} alt="Cachet" />}
          </div>

          <div className="footer">
            Merci de votre confiance. Document généré par Factarlou — Logiciel de facturation pour entreprises tunisiennes.
            Arrêté la présente facture à la somme de {formatNumber(doc.total_ttc, decimals)} {doc.currency}.
          </div>
        </div>
      </div>
    </div>
  )
}
