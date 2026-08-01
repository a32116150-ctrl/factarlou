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

    const headHTML = document.head.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Retenue ${r.number}</title>
          ${headHTML}
          <style>
            @page { size: A4; margin: 12mm 12mm 15mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 15px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-container { width: 100% !important; max-width: 210mm !important; margin: 0 auto !important; }
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .border-b-2 { border-bottom-width: 2px !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  return (
    <div className="bg-slate-100 p-2 sm:p-6 rounded-xl space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={print}><Printer className="h-4 w-4" /> Imprimer / PDF</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4 sm:p-8">
        <div ref={contentRef} className="max-w-[210mm] mx-auto text-black text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-blue-900 pb-4 mb-4 gap-3">
            <div>
              <h1 className="text-base sm:text-xl font-bold text-blue-900 leading-tight">ATTESTATION DE RETENUE À LA SOURCE</h1>
              <h2 className="text-xs text-slate-600 font-semibold mt-0.5">Article 52 du Code de l&apos;IRPP et de l&apos;IS</h2>
              <p className="mt-1 font-bold text-slate-900">N° {r.number}</p>
              <p className="text-slate-600">Date : {formatDate(r.date)}</p>
            </div>
            {r.logo_image && <img src={r.logo_image} alt="Logo" className="max-h-16 max-w-[140px] object-contain shrink-0" />}
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-white bg-blue-900 px-2 py-1 mb-2">Section A — Identification du payeur (celui qui retient)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2 w-1/3">Raison sociale</td><td className="p-2">{r.retenuer_name}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">Matricule fiscal</td><td className="p-2">{r.retenuer_mf || '—'}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">RC</td><td className="p-2">{r.retenuer_rc || '—'}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">Adresse</td><td className="p-2">{r.retenuer_address || '—'}</td></tr>
                  <tr><td className="bg-slate-100 font-bold p-2">Représentant</td><td className="p-2">{r.retenuer_rep || '—'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-white bg-blue-900 px-2 py-1 mb-2">Section B — Identification du bénéficiaire (celui qui reçoit)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2 w-1/3">Raison sociale / Nom</td><td className="p-2">{r.beneficiaire_name}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">Matricule fiscal</td><td className="p-2">{r.beneficiaire_mf || '—'}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">CIN</td><td className="p-2">{r.beneficiaire_cin || '—'}</td></tr>
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">Adresse</td><td className="p-2">{r.beneficiaire_address || '—'}</td></tr>
                  <tr><td className="bg-slate-100 font-bold p-2">RIB</td><td className="p-2">{r.beneficiaire_rib || '—'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-white bg-blue-900 px-2 py-1 mb-2">Section C — Montant</h3>
            <div className="overflow-x-auto">
              <table className="w-full sm:w-2/3 ml-auto border-collapse text-xs border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200"><td className="p-2 font-medium">Nature du revenu</td><td className="p-2 text-right">{r.nature_revenu || 'Honoraires et commissions'}</td></tr>
                  {r.facture_number && <tr className="border-b border-slate-200"><td className="p-2 font-medium">Facture concernée</td><td className="p-2 text-right">{r.facture_number}</td></tr>}
                  <tr className="border-b border-slate-200"><td className="p-2 font-medium">Montant brut</td><td className="p-2 text-right">{formatNumber(r.montant_brut, decimals)} TND</td></tr>
                  <tr className="border-b border-slate-200"><td className="p-2 font-medium">Taux de retenue</td><td className="p-2 text-right">{r.taux_retenue}%</td></tr>
                  <tr className="border-b border-slate-200 font-bold bg-slate-50"><td className="p-2">Montant de la retenue</td><td className="p-2 text-right text-blue-900">{formatNumber(r.montant_retenue, decimals)} TND</td></tr>
                  <tr className="font-bold"><td className="p-2">Montant net à payer</td><td className="p-2 text-right text-green-700">{formatNumber(r.montant_brut - r.montant_retenue, decimals)} TND</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {r.notes && (
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase text-white bg-blue-900 px-2 py-1 mb-2">Observations</h3>
              <p className="whitespace-pre-wrap m-0 text-xs p-2 bg-slate-50 border border-slate-200 rounded">{r.notes}</p>
            </div>
          )}

          <div className="flex justify-between mt-8 gap-4">
            <div className="w-1/2 text-center">
              {r.signature_image && <img src={r.signature_image} alt="Signature" className="max-h-16 max-w-[140px] mx-auto mb-1 object-contain" />}
              <div className="border-t border-black pt-1 text-xs font-bold">Signature et cachet du payeur</div>
            </div>
            <div className="w-1/2 text-center">
              {r.stamp_image && <img src={r.stamp_image} alt="Cachet" className="max-h-16 max-w-[140px] mx-auto mb-1 object-contain" />}
              <div className="border-t border-black pt-1 text-xs font-bold">Signature et cachet du bénéficiaire</div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-300 text-[10px] text-slate-500">
            Base légale : {r.base_legale || "Art. 52 du Code de l'IRPP et de l'IS"}.
          </div>
        </div>
      </div>
    </div>
  )
}
