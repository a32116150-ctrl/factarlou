import type { Retenue } from '@/types'

const DEFAULT_MF = '0000000A'

export function extractMF(value: string | null | undefined): string {
  const raw = (value || '').toUpperCase().replace(/\s+/g, '')
  const digits = raw.replace(/[^0-9]/g, '')
  const letters = raw.replace(/[^A-Z]/g, '')
  if (digits.length >= 7 && letters.length >= 1) {
    return digits.slice(0, 7) + letters[0]
  }
  const match = raw.match(/\d{7}[A-Z]/)
  return match ? match[0] : raw
}

function xmlEscape(value: string | null | undefined): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toMillimes(amount: number | null | undefined): number {
  return Math.round((amount || 0) * 1000)
}

function toDDMMYYYY(date: string | null | undefined): string {
  if (!date) return ''
  const iso = String(date).trim().split('T')[0]
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return ''
  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${parsed.getFullYear()}`
}

function yearOf(r: Retenue, fallback: number): number {
  const m = String(r.date || '').match(/^(\d{4})/)
  return m ? Number(m[1]) : fallback
}

export function getTEJOperationCode(nature: string, taux: number): string {
  const n = (nature || '').toLowerCase()
  if (n.includes('loyer')) return 'RS1_000002'
  if (n.includes('march') || n.includes('fournit')) {
    return taux === 3 ? 'RS7_000002' : 'RS7_000001'
  }
  if (n.includes('dividende')) return 'RS5_000001'
  if (n.includes('honor') || n.includes('commission') || n.includes('courtage') || n.includes('bnc')) {
    return taux === 15 ? 'RS2_000001' : 'RS2_000002'
  }
  if (taux === 15) return 'RS2_000001'
  if (taux === 10) return 'RS3_000001'
  if (taux === 1.5) return 'RS7_000001'
  if (taux === 3) return 'RS7_000002'
  return 'RS2_000001'
}

function toValidEmail(value: string | null | undefined): string {
  const email = (value || '').trim().toLowerCase()
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return email
  return 'contact@declarant.tn'
}

interface TEJDeclarationOptions {
  year: number
  month: number
  acteDepot?: '0' | '1'
  companyMF?: string | null
  companyCategory?: 'PM' | 'PP'
  companyAddress?: string | null
  companyEmail?: string | null
  companyPhone?: string | null
}

interface BeneficiaryGroup {
  key: string
  retenues: Retenue[]
}

function groupByBeneficiary(retenues: Retenue[]): BeneficiaryGroup[] {
  const map = new Map<string, BeneficiaryGroup>()
  for (const r of retenues) {
    const key = [r.beneficiaire_mf || '', r.beneficiaire_cin || '', r.beneficiaire_name || ''].join('|')
    if (!map.has(key)) {
      map.set(key, { key, retenues: [] })
    }
    map.get(key)!.retenues.push(r)
  }
  return Array.from(map.values())
}

function renderIdTaxpayer(r: Retenue): string {
  const mf = extractMF(r.beneficiaire_mf)
  if (/\d{7}[A-Z]/.test(mf)) {
    const category = r.beneficiaire_cin ? 'PP' : 'PM'
    return [
      '   <IdTaxpayer>',
      '    <MatriculeFiscal>',
      '     <TypeIdentifiant>1</TypeIdentifiant>',
      `     <Identifiant>${mf}</Identifiant>`,
      `     <CategorieContribuable>${category}</CategorieContribuable>`,
      '    </MatriculeFiscal>',
      '   </IdTaxpayer>',
    ].join('\n')
  }

  const cin = (r.beneficiaire_cin || '').trim()
  if (/^\d{8}$/.test(cin)) {
    const birthdate = r.beneficiaire_birthdate ? toDDMMYYYY(r.beneficiaire_birthdate) : ''
    if (birthdate) {
      return [
        '   <IdTaxpayer>',
        '    <CIN>',
        '     <TypeIdentifiant>2</TypeIdentifiant>',
        `     <Identifiant>${cin}</Identifiant>`,
        `     <DateNaissance>${birthdate}</DateNaissance>`,
        '     <CategorieContribuable>PP</CategorieContribuable>',
        '    </CIN>',
        '   </IdTaxpayer>',
      ].join('\n')
    }
    return [
      '   <IdTaxpayer>',
      '    <AutreIdentifiantFiscal>',
      '     <TypeIdentifiant>5</TypeIdentifiant>',
      `     <Identifiant>${cin}</Identifiant>`,
      '     <Pays>TN</Pays>',
      '     <CategorieContribuable>PP</CategorieContribuable>',
      '    </AutreIdentifiantFiscal>',
      '   </IdTaxpayer>',
    ].join('\n')
  }

  return [
    '   <IdTaxpayer>',
    '    <AutreIdentifiantFiscal>',
    '     <TypeIdentifiant>5</TypeIdentifiant>',
    '     <Identifiant>NC</Identifiant>',
    '     <Pays>TN</Pays>',
    '     <CategorieContribuable>PP</CategorieContribuable>',
    '    </AutreIdentifiantFiscal>',
    '   </IdTaxpayer>',
  ].join('\n')
}

function renderBeneficiaire(r: Retenue, options: TEJDeclarationOptions): string {
  const email = toValidEmail(r.beneficiaire_email || options.companyEmail)
  const phone = xmlEscape(r.beneficiaire_phone || options.companyPhone || '00000000')
  const address = xmlEscape(r.beneficiaire_address || options.companyAddress || '')
  return [
    '  <Beneficiaire>',
    renderIdTaxpayer(r),
    '   <Resident>1</Resident>',
    `   <NometprenonOuRaisonsociale>${xmlEscape(r.beneficiaire_name || '')}</NometprenonOuRaisonsociale>`,
    `   <Adresse>${address}</Adresse>`,
    '   <InfosContact>',
    `    <AdresseMail>${email}</AdresseMail>`,
    `    <NumTel>${phone}</NumTel>`,
    '   </InfosContact>',
    '  </Beneficiaire>',
  ].join('\n')
}

function renderOperation(r: Retenue, year: number): string {
  const brut = toMillimes(r.montant_brut)
  const retenue = toMillimes(r.montant_retenue)
  const net = toMillimes((r.montant_brut || 0) - (r.montant_retenue || 0))
  const taux = (r.taux_retenue || 0).toFixed(2)
  const opCode = r.dgi_code || getTEJOperationCode(r.nature_revenu, r.taux_retenue)
  return [
    '   <Operation IdTypeOperation="' + opCode + '">',
    `    <AnneeFacturation>${year}</AnneeFacturation>`,
    '    <CNPC>0</CNPC>',
    '    <P_Charge>0</P_Charge>',
    `    <MontantHT>${brut}</MontantHT>`,
    `    <TauxRS>${taux}</TauxRS>`,
    `    <MontantTTC>${brut}</MontantTTC>`,
    `    <MontantRS>${retenue}</MontantRS>`,
    `    <MontantNetServi>${net}</MontantNetServi>`,
    '   </Operation>',
  ].join('\n')
}

export function generateDeclarationsRSXml(retenues: Retenue[], options: TEJDeclarationOptions): string {
  const year = options.year
  const month = options.month
  const acteDepot = options.acteDepot || '0'
  const declarantMF = extractMF(options.companyMF) || DEFAULT_MF
  const declarantCategory = options.companyCategory || 'PM'

  const groups = groupByBeneficiary(retenues)
  let seq = 1

  const certificates = groups.map((group) => {
    const first = group.retenues[0]
    const operations = group.retenues.map((r) => renderOperation(r, yearOf(r, year))).join('\n')
    const totalHT = group.retenues.reduce((sum, r) => sum + toMillimes(r.montant_brut), 0)
    const totalTTC = totalHT
    const totalRS = group.retenues.reduce((sum, r) => sum + toMillimes(r.montant_retenue), 0)
    const totalNet = group.retenues.reduce((sum, r) => sum + toMillimes((r.montant_brut || 0) - (r.montant_retenue || 0)), 0)
    const ref = first.number || first.facture_number || `RS-${year}-${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`
    const datePayement = toDDMMYYYY(first.date) || `01/${String(month).padStart(2, '0')}/${year}`
    seq += 1

    return [
      ' <Certificat>',
      renderBeneficiaire(first, options),
      `  <DatePayement>${datePayement}</DatePayement>`,
      `  <Ref_certif_chez_declarant>${xmlEscape(ref)}</Ref_certif_chez_declarant>`,
      '  <ListeOperations>',
      operations,
      '  </ListeOperations>',
      '  <TotalPayement>',
      `   <TotalMontantHT>${totalHT}</TotalMontantHT>`,
      `   <TotalMontantTTC>${totalTTC}</TotalMontantTTC>`,
      `   <TotalMontantRS>${totalRS}</TotalMontantRS>`,
      `   <TotalMontantNetServi>${totalNet}</TotalMontantNetServi>`,
      '  </TotalPayement>',
      ' </Certificat>',
    ].join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<DeclarationsRS VersionSchema="1.0">',
    ' <Declarant>',
    '  <TypeIdentifiant>1</TypeIdentifiant>',
    `  <Identifiant>${declarantMF}</Identifiant>`,
    `  <CategorieContribuable>${declarantCategory}</CategorieContribuable>`,
    ' </Declarant>',
    ' <ReferenceDeclaration>',
    `  <ActeDepot>${acteDepot}</ActeDepot>`,
    `  <AnneeDepot>${year}</AnneeDepot>`,
    `  <MoisDepot>${String(month).padStart(2, '0')}</MoisDepot>`,
    ' </ReferenceDeclaration>',
    ' <AjouterCertificats>',
    certificates,
    ' </AjouterCertificats>',
    '</DeclarationsRS>',
  ].join('\n')
}

export function generateDeclarationsRSFilename(
  companyMF: string | null | undefined,
  year: number,
  month: number,
  acteDepot: '0' | '1' = '0'
): string {
  return `${extractMF(companyMF) || DEFAULT_MF}-${year}-${String(month).padStart(2, '0')}-${acteDepot}.xml`
}

function cleanText(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/[|<>&;\r\n]/g, ' ').trim()
}

function formatDGIAmount(amount: number): string {
  return (amount || 0).toFixed(3)
}

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
