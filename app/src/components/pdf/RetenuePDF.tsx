'use client'

import { useRef, useState } from 'react'
import { Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { Retenue } from '@/types'
import { formatDate, formatNumber } from '@/lib/formatters'
import { downloadElementAsPDF } from '@/lib/pdfDownloader'

interface RetenuePDFProps {
  retenue: Retenue
}

export function RetenuePDF({ retenue }: RetenuePDFProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)
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

  const downloadPDF = async () => {
    const content = contentRef.current
    if (!content) return
    setDownloading(true)
    try {
      await downloadElementAsPDF(content, `Retenue_${r.number || 'certificat'}.pdf`)
      toast('PDF téléchargé directement dans vos fichiers !')
    } catch (e: any) {
      console.error('PDF download error:', e)
      toast(`Erreur lors du téléchargement : ${e?.message || 'Erreur inconnue'}`, 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-slate-100 p-2 sm:p-6 rounded-xl space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={downloadPDF} loading={downloading}>
          <Download className="h-4 w-4 mr-1" /> Télécharger PDF
        </Button>
        <Button size="sm" onClick={print}>
          <Printer className="h-4 w-4 mr-1" /> Imprimer
        </Button>
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
                  <tr className="border-b border-slate-200"><td className="bg-slate-100 font-bold p-2">CIN / Passeport</td><td className="p-2">{r.beneficiaire_cin || '—'}</td></tr>
                  <tr><td className="bg-slate-100 font-bold p-2">Adresse</td><td className="p-2">{r.beneficiaire_address || '—'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-white bg-blue-900 px-2 py-1 mb-2">Section C — Montants retenus à la source</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2 text-left font-bold border-b border-slate-200">Nature des revenus</th>
                    <th className="p-2 text-left font-bold border-b border-slate-200">Base légale</th>
                    <th className="p-2 text-right font-bold border-b border-slate-200">Montant brut (TND)</th>
                    <th className="p-2 text-right font-bold border-b border-slate-200">Taux</th>
                    <th className="p-2 text-right font-bold border-b border-slate-200">Retenue (TND)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-b border-slate-200 font-medium">{r.nature_revenu}</td>
                    <td className="p-2 border-b border-slate-200 text-slate-600">{r.base_legale}</td>
                    <td className="p-2 text-right border-b border-slate-200 font-semibold">{formatNumber(r.montant_brut, decimals)}</td>
                    <td className="p-2 text-right border-b border-slate-200 font-bold text-blue-900">{r.taux_retenue}%</td>
                    <td className="p-2 text-right border-b border-slate-200 font-extrabold text-blue-900">{formatNumber(r.montant_retenue, decimals)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-start pt-4 border-t border-slate-200 mt-6">
            <div className="text-xs text-slate-500 max-w-xs">
              <p>Attestation délivrée en application de la législation fiscale tunisienne en vigueur.</p>
              {r.facture_number && <p className="mt-1 font-semibold text-slate-700">Réf Facture : {r.facture_number}</p>}
            </div>

            <div className="flex gap-4 items-center">
              {r.stamp_image && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Cachet</div>
                  <img src={r.stamp_image} alt="Cachet" className="max-h-16 max-w-[120px] object-contain" />
                </div>
              )}
              {r.signature_image && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Signature</div>
                  <img src={r.signature_image} alt="Signature" className="max-h-16 max-w-[120px] object-contain" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
