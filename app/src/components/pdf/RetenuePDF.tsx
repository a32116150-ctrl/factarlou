'use client'

import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Retenue } from '@/types'
import { formatDate, formatNumber } from '@/lib/formatters'

interface RetenuePDFProps {
  retenue: Retenue
}

export function RetenuePDF({ retenue }: RetenuePDFProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const r = retenue
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
          <title>Retenue ${r.number}</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
            body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; color: #000; margin: 0; }
            .ret-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 16px; }
            .ret-header h1 { font-size: 22px; color: #1e3a8a; margin: 0 0 4px 0; }
            .ret-header h2 { font-size: 13px; color: #333; margin: 0 0 4px 0; }
            .company-block { text-align: right; font-size: 12px; }
            .company-name { font-weight: bold; font-size: 14px; }
            .section { margin-bottom: 16px; }
            .section h3 { font-size: 12px; text-transform: uppercase; color: #fff; background: #1e3a8a; padding: 4px 8px; margin: 0 0 8px 0; }
            table.info { width: 100%; border-collapse: collapse; }
            table.info td { border: 1px solid #ddd; padding: 5px 8px; }
            table.info td.label { background: #f0f0f0; font-weight: bold; width: 25%; }
            table.amounts { width: 60%; margin-left: auto; border-collapse: collapse; }
            table.amounts td { border: 1px solid #ddd; padding: 5px 8px; }
            .footer { margin-top: 32px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 12px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
            .signature-box { width: 45%; text-align: center; }
            .signature-box img { max-height: 80px; max-width: 160px; margin-bottom: 8px; }
            .signature-line { border-top: 1px solid #000; padding-top: 6px; font-size: 11px; font-weight: bold; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
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

  return (
    <div className="bg-white border border-border-color rounded-xl overflow-hidden">
      <div className="flex justify-end px-4 py-3 border-b border-border-light">
        <Button size="sm" onClick={print}><Printer className="h-4 w-4" /> Imprimer / PDF</Button>
      </div>
      <div className="p-6 bg-white">
        <div ref={contentRef} className="max-w-[210mm] mx-auto text-black">
          <div className="ret-header">
            <div>
              <h1>ATTESTATION DE RETENUE À LA SOURCE</h1>
              <h2>Article 52 du Code de l&apos;IRPP et de l&apos;IS</h2>
              <p>N° {r.number}</p>
              <p>Date : {formatDate(r.date)}</p>
            </div>
            {r.logo_image && <img src={r.logo_image} alt="Logo" style={{ maxHeight: 70, maxWidth: 160 }} />}
          </div>

          <div className="section">
            <h3>Section A — Identification du payeur (celui qui retient)</h3>
            <table className="info">
              <tbody>
                <tr><td className="label">Raison sociale</td><td>{r.retenuer_name}</td></tr>
                <tr><td className="label">Matricule fiscal</td><td>{r.retenuer_mf || '—'}</td></tr>
                <tr><td className="label">RC</td><td>{r.retenuer_rc || '—'}</td></tr>
                <tr><td className="label">Adresse</td><td>{r.retenuer_address || '—'}</td></tr>
                <tr><td className="label">Représentant</td><td>{r.retenuer_rep || '—'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Section B — Identification du bénéficiaire (celui qui reçoit)</h3>
            <table className="info">
              <tbody>
                <tr><td className="label">Raison sociale / Nom</td><td>{r.beneficiaire_name}</td></tr>
                <tr><td className="label">Matricule fiscal</td><td>{r.beneficiaire_mf || '—'}</td></tr>
                <tr><td className="label">CIN</td><td>{r.beneficiaire_cin || '—'}</td></tr>
                <tr><td className="label">Adresse</td><td>{r.beneficiaire_address || '—'}</td></tr>
                <tr><td className="label">RIB</td><td>{r.beneficiaire_rib || '—'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Section C — Montant</h3>
            <table className="amounts">
              <tbody>
                <tr><td>Nature du revenu</td><td>{r.nature_revenu || 'Honoraires et commissions'}</td></tr>
                {r.facture_number && <tr><td>Facture concernée</td><td>{r.facture_number}</td></tr>}
                <tr><td>Montant brut</td><td className="text-right">{formatNumber(r.montant_brut, decimals)} TND</td></tr>
                <tr><td>Taux de retenue</td><td className="text-right">{r.taux_retenue}%</td></tr>
                <tr className="font-bold"><td>Montant de la retenue</td><td className="text-right">{formatNumber(r.montant_retenue, decimals)} TND</td></tr>
                <tr><td>Montant net à payer</td><td className="text-right">{formatNumber(r.montant_brut - r.montant_retenue, decimals)} TND</td></tr>
              </tbody>
            </table>
          </div>

          {r.notes && (
            <div className="section">
              <h3>Observations</h3>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{r.notes}</p>
            </div>
          )}

          <div className="signatures">
            <div className="signature-box">
              {r.signature_image && <img src={r.signature_image} alt="Signature" />}
              <div className="signature-line">Signature et cachet du payeur</div>
            </div>
            <div className="signature-box">
              {r.stamp_image && <img src={r.stamp_image} alt="Cachet" />}
              <div className="signature-line">Signature et cachet du bénéficiaire</div>
            </div>
          </div>

          <div className="footer">
            Document généré par Factarlou — Logiciel de facturation pour entreprises tunisiennes.
            Base légale : {r.base_legale || "Art. 52 du Code de l'IRPP et de l'IS"}.
          </div>
        </div>
      </div>
    </div>
  )
}
