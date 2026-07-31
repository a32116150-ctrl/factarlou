'use client'

import { useRef, useState } from 'react'
import { Printer, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { Document } from '@/types'
import { formatDate, formatNumber, formatCurrency, DOC_TYPE_LABELS } from '@/lib/formatters'

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

  const [downloading, setDownloading] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState(doc.client_email || '')
  const [emailSubject, setEmailSubject] = useState(`${DOC_TYPE_LABELS[doc.type] || doc.type} ${doc.number}`)
  const [emailBody, setEmailBody] = useState(
    `Bonjour ${doc.client_name || 'Client'},\n\nVeuillez trouver ci-joint votre document ${doc.number} du ${formatDate(doc.date)} d'un montant de ${formatCurrency(doc.total_ttc, doc.currency)}.\n\nCordialement,\n${doc.company_name || 'Factarlou'}`
  )
  const [sendingEmail, setSendingEmail] = useState(false)

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
          <title>${(doc.type || 'document').toUpperCase()} ${doc.number || ''}</title>
          <style>
            @page { size: A4; margin: 10mm 10mm 15mm 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const downloadPDF = async () => {
    if (typeof window === 'undefined') return
    const content = contentRef.current
    if (!content) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight))
      pdf.save(`${doc.number || 'document'}.pdf`)
      toast('PDF téléchargé avec succès')
    } catch (e) {
      console.error('PDF download error:', e)
      print()
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
    <div style={{ backgroundColor: '#f1f5f9', padding: '24px', borderRadius: '12px' }}>
      {/* Top Action Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <Button variant="secondary" size="sm" onClick={() => setEmailModal(true)}>
          <Mail className="h-4 w-4" /> Envoyer par Email
        </Button>
        <Button variant="secondary" size="sm" onClick={downloadPDF} loading={downloading}>
          <Download className="h-4 w-4" /> Télécharger PDF
        </Button>
        <Button size="sm" onClick={print}>
          <Printer className="h-4 w-4" /> Imprimer
        </Button>
      </div>

      {/* Printable Invoice Container */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div ref={contentRef} style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '32px', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box' }}>
          
          {/* Header Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a8a', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              {doc.logo_image ? (
                <img src={doc.logo_image} alt="Logo" style={{ maxHeight: '60px', maxWidth: '200px', marginBottom: '12px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px', marginBottom: '6px' }}>
                  {doc.company_name || 'MON ENTREPRISE'}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                {doc.company_address && <div>{doc.company_address}</div>}
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                  {doc.company_mf && <span><strong>MF :</strong> {doc.company_mf}</span>}
                  {doc.company_rc && <span><strong>RC :</strong> {doc.company_rc}</span>}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                  {doc.company_phone && <span><strong>Tél :</strong> {doc.company_phone}</span>}
                  {doc.company_email && <span><strong>Email :</strong> {doc.company_email}</span>}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', textTransform: uppercaseText(titleText), letterSpacing: '0.5px', marginBottom: '8px' }}>
                {titleText}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                N° {doc.number || '—'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: '1.5' }}>
                <div><strong>Date :</strong> {formatDate(doc.date)}</div>
                {doc.due_date && <div><strong>Échéance :</strong> {formatDate(doc.due_date)}</div>}
              </div>
            </div>
          </div>

          {/* Parties Grid (Émetteur vs Client) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Émetteur / Vendeur
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {doc.company_name || 'Vendeur'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: '1.5' }}>
                {doc.company_mf && <div>MF : {doc.company_mf}</div>}
                {doc.company_address && <div>{doc.company_address}</div>}
                {doc.company_phone && <div>Tél : {doc.company_phone}</div>}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Client / Facturé à
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {doc.client_name || 'Client Non Spécifié'}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', lineHeight: '1.5' }}>
                {doc.client_mf && <div><strong>Matricule Fiscal :</strong> {doc.client_mf}</div>}
                {doc.client_address && <div><strong>Adresse :</strong> {doc.client_address}</div>}
                {doc.client_phone && <div><strong>Tél :</strong> {doc.client_phone}</div>}
                {doc.client_email && <div><strong>Email :</strong> {doc.client_email}</div>}
                {doc.payment_mode && <div><strong>Mode de Règlement :</strong> {doc.payment_mode}</div>}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '35px' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Désignation / Service</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '75px' }}>Unité</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '65px' }}>Qté</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '110px' }}>Prix HT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '65px' }}>TVA</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', width: '110px' }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, i: number) => {
                if (!it) return null
                const qty = Number(it.quantity) || 0
                const price = Number(it.price) || 0
                const tva = Number(it.tva) || 0
                const isEven = i % 2 === 0
                return (
                  <tr key={i} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{it.description || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>{it.unit || 'unité'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#334155' }}>{formatNumber(price, decimals)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>{tva}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatNumber(qty * price, decimals)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals & TVA Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'flex-start', marginBottom: '28px' }}>
            {/* Left: TVA Summary Table */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Ventilation de la TVA
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>Taux TVA</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Base HT</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Montant TVA</th>
                  </tr>
                </thead>
                <tbody>
                  {tvaLines.map((l) => (
                    <tr key={l.rate} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', color: '#334155' }}>{l.rate}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#334155' }}>{formatNumber(l.base, decimals)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatNumber(l.amount, decimals)}</td>
                    </tr>
                  ))}
                  {tvaLines.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>Aucune TVA applicable</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Totals Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                <span>Total Hors Taxe (HT) :</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatNumber(doc.total_ht, decimals)} {doc.currency || 'TND'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                <span>Total TVA :</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatNumber(doc.total_tva, decimals)} {doc.currency || 'TND'}</span>
              </div>

              {Number(doc.timbre_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                  <span>Droit de Timbre Fiscal :</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatNumber(doc.timbre_amount, decimals)} {doc.currency || 'TND'}</span>
                </div>
              )}

              {Number(doc.discount_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626', marginBottom: '6px' }}>
                  <span>Remise Accordée :</span>
                  <span style={{ fontWeight: 600 }}>-{formatNumber(doc.discount_amount, decimals)} {doc.currency || 'TND'}</span>
                </div>
              )}

              <div style={{ borderTop: '2px solid #cbd5e1', marginTop: '10px', paddingTop: '10px' }}>
                <div style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net à Payer (TTC)</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>{formatNumber(doc.total_ttc, decimals)} {doc.currency || 'TND'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Notes & Signatures */}
          {doc.notes && (
            <div style={{ backgroundColor: '#fffbe3', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '4px', marginBottom: '20px', fontSize: '12px', color: '#78350f' }}>
              <strong>Notes / Conditions :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{doc.notes}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '340px', lineHeight: '1.5' }}>
              <div><strong>Arrêté le présent document à la somme de :</strong></div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {formatNumber(doc.total_ttc, decimals)} {doc.currency || 'TND'}
              </div>
              <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                Merci de votre confiance. Document généré par Factarlou.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', textAlign: 'center' }}>
              {doc.stamp_image && (
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', uppercaseText: 'uppercase', marginBottom: '4px' }}>Cachet</div>
                  <img src={doc.stamp_image} alt="Cachet" style={{ maxHeight: '80px', maxWidth: '140px', objectFit: 'contain' }} />
                </div>
              )}
              {doc.signature_image && (
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', uppercaseText: 'uppercase', marginBottom: '4px' }}>Signature</div>
                  <img src={doc.signature_image} alt="Signature" style={{ maxHeight: '80px', maxWidth: '140px', objectFit: 'contain' }} />
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

function uppercaseText(str: string): string {
  return String(str || '').toUpperCase()
}
