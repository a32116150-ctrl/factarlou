import type { Retenue } from '@/types'

/**
 * Format a number to 3 decimal places for Tunisian DGI TEJ format (e.g. 1500.000)
 */
function formatDGIAmount(amount: number): string {
  return (amount || 0).toFixed(3)
}

/**
 * Clean up text for fixed-width or pipe-delimited TXT export
 */
function cleanText(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/[|;\r\n]/g, ' ').trim()
}

/**
 * Determine DGI Code Retenue from nature_revenu or taux_retenue
 */
export function getDGICodeRetenue(nature: string, taux: number): string {
  const n = (nature || '').toLowerCase()
  if (n.includes('honor') || n.includes('loyer') || taux === 15) return '01' // Honoraires / Loyers 15%
  if (n.includes('march') || n.includes('fournit') || taux === 1.5) return '02' // Retenue marchés 1.5%
  if (taux === 3) return '03' // Retenue 3%
  if (taux === 10) return '04' // Retenue 10%
  return '01' // Default
}

/**
 * Generate DGI official TEJ text format (.txt)
 * Format:
 * Line 0 (Header): 0|MF_EMETTEUR|ANNEE|PERIODE|NB_LIGNES|TOTAL_BRUT|TOTAL_RETENUE
 * Line 1 (Records): 1|MF_BENEFICIAIRE|CIN_BENEFICIAIRE|NOM_BENEFICIAIRE|DATE_PAIEMENT|CODE_RETENUE|MONTANT_BRUT|TAUX_RETENUE|MONTANT_RETENUE|MONTANT_NET
 */
export function generateTEJTxt(retenues: Retenue[], companyMF: string, year: number, periodLabel: string): string {
  const totalBrut = retenues.reduce((sum, r) => sum + (r.montant_brut || 0), 0)
  const totalRetenue = retenues.reduce((sum, r) => sum + (r.montant_retenue || 0), 0)
  const cleanMF = cleanText(companyMF || '0000000/A/M/000')

  const lines: string[] = []

  // Header line (Line Type 0)
  lines.push(`0|${cleanMF}|${year}|${cleanText(periodLabel)}|${retenues.length}|${formatDGIAmount(totalBrut)}|${formatDGIAmount(totalRetenue)}`)

  // Data lines (Line Type 1)
  retenues.forEach((r, idx) => {
    const mfBenef = cleanText(r.beneficiaire_mf || '')
    const cinBenef = cleanText(r.beneficiaire_cin || '')
    const nomBenef = cleanText(r.beneficiaire_name || 'Bénéficiaire Anonyme')
    const dateStr = r.date ? r.date.split('T')[0] : ''
    const codeRetenue = getDGICodeRetenue(r.nature_revenu, r.taux_retenue)
    const brut = formatDGIAmount(r.montant_brut)
    const taux = (r.taux_retenue || 0).toFixed(2)
    const retenue = formatDGIAmount(r.montant_retenue)
    const net = formatDGIAmount((r.montant_brut || 0) - (r.montant_retenue || 0))

    lines.push(`1|${idx + 1}|${mfBenef}|${cinBenef}|${nomBenef}|${dateStr}|${codeRetenue}|${brut}|${taux}|${retenue}|${net}`)
  })

  return lines.join('\r\n')
}

/**
 * Generate CSV export for Excel compatibility
 */
export function generateTEJCsv(retenues: Retenue[]): string {
  const headers = [
    'N° Certificat',
    'Date',
    'Matricule Fiscal / CIN Bénéficiaire',
    'Raison Sociale / Nom Bénéficiaire',
    'Adresse Bénéficiaire',
    'Nature Revenu',
    'Facture Réf.',
    'Montant Brut (TND)',
    'Taux Retenue (%)',
    'Montant Retenue (TND)',
    'Montant Net Versé (TND)',
  ]

  const rows = retenues.map((r) => {
    const idBenef = r.beneficiaire_mf || r.beneficiaire_cin || ''
    const net = (r.montant_brut || 0) - (r.montant_retenue || 0)
    return [
      `"${cleanText(r.number)}"`,
      `"${r.date ? r.date.split('T')[0] : ''}"`,
      `"${cleanText(idBenef)}"`,
      `"${cleanText(r.beneficiaire_name)}"`,
      `"${cleanText(r.beneficiaire_address || '')}"`,
      `"${cleanText(r.nature_revenu || '')}"`,
      `"${cleanText(r.facture_number || '')}"`,
      formatDGIAmount(r.montant_brut),
      (r.taux_retenue || 0).toString(),
      formatDGIAmount(r.montant_retenue),
      formatDGIAmount(net),
    ].join(';')
  })

  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
}

/**
 * Download a string content as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
