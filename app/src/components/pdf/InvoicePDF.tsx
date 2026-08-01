'use client'

import { useRef, useState, useEffect } from 'react'
import { Printer, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { Document } from '@/types'
import { formatDate, formatNumber, formatCurrency, DOC_TYPE_LABELS } from '@/lib/formatters'
import { downloadElementAsPDF } from '@/lib/pdfDownloader'

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
  const { toast } = useToast()

  const [company, setCompany] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState(doc.client_email || '')
  const [emailSubject, setEmailSubject] = useState(`${DOC_TYPE_LABELS[doc.type] || doc.type} ${doc.number}`)
  const [emailBody, setEmailBody] = useState(
    `Bonjour ${doc.client_name || 'Client'},\n\nVeuillez trouver ci-joint votre document ${doc.number} du ${formatDate(doc.date)} d'un montant de ${formatCurrency(doc.total_ttc, doc.currency)}.\n\nCordialement,\n${doc.company_name || 'Votre Entreprise'}`
  )
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (!doc.company_name || !doc.company_mf) {
      fetch('/app/api/companies')
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setCompany(json.data)
        })
        .catch(() => {})
    }
    fetch('/app/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setSettings(json.data)
      })
      .catch(() => {})
  }, [doc.company_name, doc.company_mf])

  let primaryColor = '#1e3a8a'
  let customFooterText = ''
  let showSignatureBox = true
  if (settings?.document_theme) {
    try {
      const parsed = JSON.parse(settings.document_theme)
      if (parsed.primaryColor) primaryColor = parsed.primaryColor
      if (parsed.customFooterText) customFooterText = parsed.customFooterText
      if (parsed.showSignatureBox !== undefined) showSignatureBox = parsed.showSignatureBox
    } catch {
      if (typeof settings.document_theme === 'string' && settings.document_theme.startsWith('#')) {
        primaryColor = settings.document_theme
      }
    }
  }

  const companyName = doc.company_name || company?.name || ''
  const companyMF = doc.company_mf || company?.mf || ''
  const companyAddress = doc.company_address || company?.address || ''
  const companyPhone = doc.company_phone || company?.phone || ''
  const companyEmail = doc.company_email || company?.email || ''
  const companyRC = doc.company_rc || company?.rc || ''
  const logoImage = doc.logo_image || company?.logo_image || null
  const stampImage = doc.stamp_image || company?.stamp_image || null
  const signatureImage = doc.signature_image || company?.signature_image || null

  const rawItems = typeof doc.items_json === 'string' ? (tryParseJSON(doc.items_json) || []) : (doc.items_json || [])
  const items = Array.isArray(rawItems) ? rawItems : []
  const decimals = 3

  const docTypeLabel = DOC_TYPE_LABELS[doc.type] || doc.type || 'Facture'
  const docTitle = `${docTypeLabel} ${doc.number || ''}`

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
          <title>${docTitle}</title>
          ${headHTML}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 8mm 8mm 8mm;
            }
            @media print {
              html, body {
                background-color: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 15px !important;
            }
            .print-container {
              width: 100% !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
            }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
            .flex { display: flex !important; }
            .flex-row { flex-direction: row !important; }
            .justify-between { justify-content: space-between !important; }
            .items-start { align-items: flex-start !important; }
            .items-end { align-items: flex-end !important; }
            .items-center { align-items: center !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border-color: #e2e8f0 !important; }
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
    setTimeout(() => printWindow.print(), 350)
  }

  const downloadPDF = async () => {
    const content = contentRef.current
    if (!content) return
    setDownloading(true)
    try {
      const fileName = `${doc.number || 'Document'}.pdf`
      await downloadElementAsPDF(content, fileName)
      toast('PDF téléchargé directement dans vos fichiers !')
    } catch (e: any) {
      console.error('PDF download error:', e)
      toast(`Erreur lors du téléchargement direct : ${e?.message || 'Erreur inconnue'}`, 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast('Veuillez entrer une adresse email', 'error')
      return
    }
    setSendingEmail(true)
    const res = await fetch('/app/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailTo,
        subject: emailSubject,
        body: emailBody.replace(/\n/g, '<br>'),
      }),
    })
    setSendingEmail(false)

    if (res.ok) {
      toast('Email envoyé avec succès')
      setEmailModal(false)
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur lors de l\'envoi (vérifiez la configuration SMTP)', 'error')
    }
  }

  const tvaLines: Array<{ rate: number; base: number; amount: number }> = []
  items.forEach((it: any) => {
    if (!it) return
    const rate = Number(it.tva) || 0
    const existing = tvaLines.find((l) => l.rate === rate)
    const ht = (Number(it.quantity) || 0) * (Number(it.price) || 0)
    if (existing) {
      existing.base += ht
      existing.amount += (ht * rate) / 100
    } else {
      tvaLines.push({ rate, base: ht, amount: (ht * rate) / 100 })
    }
  })
  tvaLines.sort((a, b) => b.rate - a.rate)

  const docType = doc?.type || 'facture'
  const titleText = DOC_TYPE_LABELS[docType] || docType

  return (
    <div className="p-2 sm:p-6 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-stretch sm:justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEmailModal(true)} className="flex-1 sm:flex-none justify-center">
          <Mail className="h-4 w-4" /> <span className="hidden sm:inline">Envoyer par Email</span><span className="sm:hidden">Email</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={downloadPDF} loading={downloading} className="flex-1 sm:flex-none justify-center">
          <Download className="h-4 w-4" /> <span className="hidden sm:inline">Télécharger PDF</span><span className="sm:hidden">PDF</span>
        </Button>
        <Button size="sm" onClick={print} className="flex-1 sm:flex-none justify-center">
          <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Imprimer</span><span className="sm:hidden">Imprimer</span>
        </Button>
      </div>

      {/* Printable Invoice Container */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div ref={contentRef} className="w-full max-w-[210mm] mx-auto p-4 sm:p-8 bg-white text-slate-900 font-sans box-border">
          
          {/* Header Block */}
          <div className="flex flex-row justify-between items-start gap-4 border-b-2 border-slate-800 pb-5 mb-6">
            <div className="flex-1">
              {logoImage ? (
                <img src={logoImage} alt="Logo" className="max-h-16 max-w-[220px] mb-3 object-contain" />
              ) : companyName ? (
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {companyName}
                </div>
              ) : null}
              <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
                {companyAddress && <div>{companyAddress}</div>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {companyMF && <span><strong>MF :</strong> {companyMF}</span>}
                  {companyRC && <span><strong>RC :</strong> {companyRC}</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {companyPhone && <span><strong>Tél :</strong> {companyPhone}</span>}
                  {companyEmail && <span><strong>Email :</strong> {companyEmail}</span>}
                </div>
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <div className="inline-block bg-slate-100 text-slate-900 px-3.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider mb-2 border border-slate-200">
                {titleText}
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                N° {doc.number || '—'}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 space-y-0.5">
                <div><strong>Date :</strong> {formatDate(doc.date)}</div>
                {doc.due_date && <div><strong>Échéance :</strong> {formatDate(doc.due_date)}</div>}
              </div>
            </div>
          </div>

          {/* Parties Grid (Émetteur vs Client) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Émetteur / Vendeur
              </div>
              {companyName && (
                <div className="text-sm font-bold text-slate-900">
                  {companyName}
                </div>
              )}
              <div className="text-xs text-slate-600 mt-1 space-y-0.5 leading-relaxed">
                {companyMF && <div>MF : {companyMF}</div>}
                {companyAddress && <div>{companyAddress}</div>}
                {companyPhone && <div>Tél : {companyPhone}</div>}
                {companyEmail && <div>Email : {companyEmail}</div>}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Client / Facturé à
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                {doc.client_name || 'Client Non Spécifié'}
              </div>
              <div className="text-xs text-slate-700 mt-1 space-y-0.5 leading-relaxed">
                {doc.client_mf && <div><strong>Matricule Fiscal :</strong> {doc.client_mf}</div>}
                {doc.client_address && <div><strong>Adresse :</strong> {doc.client_address}</div>}
                {doc.client_phone && <div><strong>Tél :</strong> {doc.client_phone}</div>}
                {doc.client_email && <div><strong>Email :</strong> {doc.client_email}</div>}
                {doc.payment_mode && <div><strong>Mode de Règlement :</strong> {doc.payment_mode}</div>}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[550px]">
              <thead>
                <tr className="text-white font-bold" style={{ backgroundColor: primaryColor }}>
                  <th className="p-2.5 text-center font-bold uppercase w-8">#</th>
                  <th className="p-2.5 text-left font-bold uppercase">Désignation / Service</th>
                  <th className="p-2.5 text-center font-bold uppercase w-16">Unité</th>
                  <th className="p-2.5 text-right font-bold uppercase w-14">Qté</th>
                  <th className="p-2.5 text-right font-bold uppercase w-24">Prix HT</th>
                  <th className="p-2.5 text-right font-bold uppercase w-14">TVA</th>
                  <th className="p-2.5 text-right font-bold uppercase w-24">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((it: any, i: number) => {
                  if (!it) return null
                  const qty = Number(it.quantity) || 0
                  const price = Number(it.price) || 0
                  const tva = Number(it.tva) || 0
                  const isEven = i % 2 === 0
                  return (
                    <tr key={i} className={isEven ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2.5 text-center text-slate-500">{i + 1}</td>
                      <td className="p-2.5 text-left font-medium text-slate-900">{it.description || '—'}</td>
                      <td className="p-2.5 text-center text-slate-500">{it.unit || 'unité'}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">{qty}</td>
                      <td className="p-2.5 text-right text-slate-700">{formatNumber(price, decimals)}</td>
                      <td className="p-2.5 text-right text-slate-500">{tva}%</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatNumber(qty * price, decimals)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & TVA Breakdown Grid */}
          <div className="grid grid-cols-2 gap-6 items-start mb-7">
            {/* Left: TVA Summary Table */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ventilation de la TVA
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 text-left font-semibold">Taux TVA</th>
                      <th className="p-2 text-right font-semibold">Base HT</th>
                      <th className="p-2 text-right font-semibold">Montant TVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tvaLines.map((l) => (
                      <tr key={l.rate}>
                        <td className="p-2 text-slate-700">{l.rate}%</td>
                        <td className="p-2 text-right text-slate-700">{formatNumber(l.base, decimals)}</td>
                        <td className="p-2 text-right font-semibold text-slate-900">{formatNumber(l.amount, decimals)}</td>
                      </tr>
                    ))}
                    {tvaLines.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-2.5 text-center text-slate-400">Aucune TVA applicable</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Totals Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                <span>Total Hors Taxe (HT) :</span>
                <span className="font-semibold text-slate-900">{formatNumber(doc.total_ht, decimals)} {doc.currency || 'TND'}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                <span>Total TVA :</span>
                <span className="font-semibold text-slate-900">{formatNumber(doc.total_tva, decimals)} {doc.currency || 'TND'}</span>
              </div>

              {Number(doc.timbre_amount) > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span>Droit de Timbre Fiscal :</span>
                  <span className="font-semibold text-slate-900">{formatNumber(doc.timbre_amount, decimals)} {doc.currency || 'TND'}</span>
                </div>
              )}

              {Number(doc.discount_amount) > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-red-600">
                  <span>Remise Accordée :</span>
                  <span className="font-semibold">-{formatNumber(doc.discount_amount, decimals)} {doc.currency || 'TND'}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-300 pt-3.5 mt-2">
                <div className="text-white p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
                  <span className="text-xs font-bold uppercase tracking-wider">Net à Payer (TTC)</span>
                  <span className="text-base sm:text-lg font-extrabold">{formatNumber(doc.total_ttc, decimals)} {doc.currency || 'TND'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Notes & Signatures */}
          {doc.notes && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-900 mb-6">
              <strong>Notes / Conditions :</strong>
              <div className="whitespace-pre-wrap mt-1">{doc.notes}</div>
            </div>
          )}

          <div className="flex flex-row justify-between items-end gap-6 pt-5 border-t border-slate-200 mt-6">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <div><strong>Arrêté le présent document à la somme de :</strong></div>
              <div className="text-sm font-bold text-slate-900">
                {formatNumber(doc.total_ttc, decimals)} {doc.currency || 'TND'}
              </div>
              <div className="italic text-slate-500 mt-2 font-medium">
                {customFooterText || 'Merci de votre confiance.'}
              </div>
            </div>

            <div className="flex gap-4 items-center">
              {stampImage && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Cachet</div>
                  <img src={stampImage} alt="Cachet" className="max-h-20 max-w-[140px] object-contain" />
                </div>
              )}
              {signatureImage && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Signature</div>
                  <img src={signatureImage} alt="Signature" className="max-h-20 max-w-[140px] object-contain" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Email Modal */}
      <Modal
        open={emailModal}
        onClose={() => setEmailModal(false)}
        title={`Envoyer le document ${doc.number}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEmailModal(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} loading={sendingEmail}>Envoyer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email du destinataire"
            type="email"
            placeholder="client@entreprise.tn"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <Input
            label="Objet de l'email"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
          <Textarea
            label="Message"
            rows={5}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
