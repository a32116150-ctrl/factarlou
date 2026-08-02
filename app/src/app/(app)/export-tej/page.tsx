'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  FileOutput, Download, FileSpreadsheet, Printer, Filter, AlertTriangle,
  CheckCircle2, ArrowLeftRight, Calendar, Search, Building2, Layers,
  Upload, FileText, FileCode, Plus, Check, RefreshCw, X, Sparkles, Database,
  Eye, FileCheck, Trash2
} from 'lucide-react'
import type { Retenue, Company } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatNumber } from '@/lib/formatters'
import { generateDeclarationsRSXml, generateDeclarationsRSFilename, generateTEJCsv, downloadFile } from '@/lib/tejExporter'

interface ParsedRecord {
  id: string
  date: string
  retenuer_name: string
  retenuer_mf: string
  beneficiaire_name: string
  beneficiaire_mf: string
  beneficiaire_cin: string
  beneficiaire_email: string
  beneficiaire_phone: string
  beneficiaire_address: string
  nature_revenu: string
  dgi_code: string
  montant_brut: number
  taux_retenue: number
  montant_retenue: number
  facture_number: string
}

const DGI_OPERATION_CODES: { code: string; label: string }[] = [
  { code: 'RS2_000001', label: 'RS2_000001 — Honoraires BNC (forfait d\'assiette)' },
  { code: 'RS2_000002', label: 'RS2_000002 — Honoraires BNC (régime réel)' },
  { code: 'RS1_000002', label: 'RS1_000002 — Loyers servis à des résidents' },
  { code: 'RS7_000001', label: 'RS7_000001 — Acquisitions marchandises/services (1.5%)' },
  { code: 'RS7_000002', label: 'RS7_000002 — Acquisitions marchandises/services (IS 15%)' },
  { code: 'RS3_000001', label: 'RS3_000001 — Revenus de capitaux mobiliers' },
  { code: 'RS5_000001', label: 'RS5_000001 — Dividendes' },
]

const DGI_NATURE_BY_CODE: Record<string, string> = {
  'RS1_000002': 'Loyers servis à des résidents établis',
  'RS2_000001': 'Honoraires, commissions et courtages',
  'RS2_000002': 'Honoraires BNC régime réel',
  'RS2_000003': 'Rémunérations en contrepartie de la performance',
  'RS3_000001': 'Revenus de capitaux mobiliers',
  'RS5_000001': 'Dividendes',
  'RS7_000001': 'Acquisitions de marchandises, matériel, équipements et services',
  'RS7_000002': 'Acquisitions de marchandises, matériel, équipements et services (IS 15%)',
  'RS7_000003': 'Acquisitions de marchandises, matériel, équipements et services (IS 10%)',
}

function toISODate(value: string): string {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return value
}

function natureFromCode(code: string): string {
  return DGI_NATURE_BY_CODE[code] || 'Honoraires et commissions'
}

function yearMonthOf(date: string, fallbackYear: number): { year: number; month: number } {
  const iso = String(date || '').split('T')[0]
  const parts = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (parts) return { year: Number(parts[1]), month: Number(parts[2]) }
  return { year: fallbackYear, month: 1 }
}

export default function ExportTEJPage() {
  const { toast } = useToast()
  const [retenues, setRetenues] = useState<Retenue[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Importer Modal State
  const [isImporterOpen, setIsImporterOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Line Form inside Importer
  const [manualName, setManualName] = useState('')
  const [manualMf, setManualMf] = useState('')
  const [manualBrut, setManualBrut] = useState<number | ''>('')
  const [manualTaux, setManualTaux] = useState<number>(15)
  const [manualNature, setManualNature] = useState('Honoraires, commissions et courtages')
  const [manualDgiCode, setManualDgiCode] = useState('RS2_000001')
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualAddress, setManualAddress] = useState('')

  // Filters
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resRetenues, resCompany] = await Promise.all([
        fetch('/app/api/retenues'),
        fetch('/app/api/companies'),
      ])

      if (resRetenues.ok) {
        const json = await resRetenues.json()
        setRetenues(json.data || [])
      }

      if (resCompany.ok) {
        const json = await resCompany.json()
        const companies = json.data || []
        if (companies.length > 0) {
          setCompany(companies[0])
        }
      }
    } catch (err) {
      console.error(err)
      toast('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate Demo Data for testing
  const handleGenerateDemoData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const demoItems = [
      {
        date: today,
        retenuer_name: company?.name || 'Ma Société SARL',
        retenuer_mf: company?.mf || '1234567/A/M/000',
        beneficiaire_name: 'Cabinet d\'Avocats Ben Ammar',
        beneficiaire_mf: '0987654/B/A/000',
        beneficiaire_cin: '',
        natureRevenu: 'Honoraires, commissions et courtages (15%)',
        montantBrut: 2000,
        tauxRetenue: 15,
        facture_number: 'FAC-2026-001'
      },
      {
        date: today,
        retenuer_name: company?.name || 'Ma Société SARL',
        retenuer_mf: company?.mf || '1234567/A/M/000',
        beneficiaire_name: 'Fournisseur Matériel IT Tunisie',
        beneficiaire_mf: '0147258/C/M/000',
        beneficiaire_cin: '',
        natureRevenu: 'Retenue sur marchés et fournitures (1.5%)',
        montantBrut: 5400,
        tauxRetenue: 1.5,
        facture_number: 'FAC-2026-002'
      },
      {
        date: today,
        retenuer_name: company?.name || 'Ma Société SARL',
        retenuer_mf: company?.mf || '1234567/A/M/000',
        beneficiaire_name: 'Société Immobilière du Sud',
        beneficiaire_mf: '0369258/D/M/000',
        beneficiaire_cin: '',
        natureRevenu: 'Loyers d\'immeubles (15%)',
        montantBrut: 1200,
        tauxRetenue: 15,
        facture_number: 'FAC-2026-003'
      }
    ]

    try {
      for (const item of demoItems) {
        await fetch('/app/api/retenues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
      }
      toast('3 certificats de retenue démo créés avec succès !')
      loadData()
    } catch (err) {
      toast('Erreur lors de la création des données de démo', 'error')
      setLoading(false)
    }
  }

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear])
    retenues.forEach((r) => {
      if (r.year) years.add(r.year)
      else if (r.date) years.add(new Date(r.date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [retenues, currentYear])

  // Filtered Retenues
  const filteredRetenues = useMemo(() => {
    return retenues.filter((r) => {
      const rYear = r.year || (r.date ? new Date(r.date).getFullYear() : currentYear)
      if (selectedYear !== 0 && rYear !== selectedYear) return false

      if (selectedPeriod !== 'ALL' && r.date) {
        const dateObj = new Date(r.date)
        const month = dateObj.getMonth() + 1

        if (selectedPeriod === 'Q1' && !(month >= 1 && month <= 3)) return false
        if (selectedPeriod === 'Q2' && !(month >= 4 && month <= 6)) return false
        if (selectedPeriod === 'Q3' && !(month >= 7 && month <= 9)) return false
        if (selectedPeriod === 'Q4' && !(month >= 10 && month <= 12)) return false

        if (selectedPeriod.startsWith('M')) {
          const mNum = parseInt(selectedPeriod.replace('M', ''), 10)
          if (month !== mNum) return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const bName = (r.beneficiaire_name || '').toLowerCase()
        const bMf = (r.beneficiaire_mf || '').toLowerCase()
        const num = (r.number || '').toLowerCase()
        if (!bName.includes(q) && !bMf.includes(q) && !num.includes(q)) return false
      }

      return true
    })
  }, [retenues, selectedYear, selectedPeriod, searchQuery, currentYear])

  // Totals
  const totals = useMemo(() => {
    const count = filteredRetenues.length
    const brut = filteredRetenues.reduce((sum, r) => sum + (r.montant_brut || 0), 0)
    const retenue = filteredRetenues.reduce((sum, r) => sum + (r.montant_retenue || 0), 0)
    const net = brut - retenue
    return { count, brut, retenue, net }
  }, [filteredRetenues])

  // Missing MF check
  const missingMFCount = useMemo(() => {
    return filteredRetenues.filter((r) => !r.beneficiaire_mf && !r.beneficiaire_cin).length
  }, [filteredRetenues])

  // Handlers for Exports
  const handleExportXML = () => {
    if (filteredRetenues.length === 0) {
      toast('Veuillez ajouter des retenues ou importer un fichier avant d’exporter', 'info')
      setIsImporterOpen(true)
      return
    }
    const companyMF = company?.mf || '0000000/A/M/000'

    const byMonth = new Map<string, Retenue[]>()
    filteredRetenues.forEach((r) => {
      const { year, month } = yearMonthOf(r.date || '', currentYear)
      const key = `${year}-${month}`
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key)!.push(r)
    })

    byMonth.forEach((records, key) => {
      const [year, month] = key.split('-').map(Number)
      const xmlContent = generateDeclarationsRSXml(records, {
        year,
        month,
        companyMF,
        companyCategory: 'PM',
        companyAddress: company?.address,
        companyEmail: company?.email,
        companyPhone: company?.phone,
      })
      const filename = generateDeclarationsRSFilename(companyMF, year, month, '0')
      downloadFile(xmlContent, filename, 'application/xml;charset=utf-8')
    })

    toast(`${byMonth.size} fichier(s) XML officiel(s) TEJ téléchargé(s) !`)
  }

  const handleExportCSV = () => {
    if (filteredRetenues.length === 0) {
      toast('Veuillez ajouter des retenues ou importer un fichier avant d’exporter', 'info')
      setIsImporterOpen(true)
      return
    }
    const content = generateTEJCsv(filteredRetenues)
    const filename = `Retenues_TEJ_${selectedYear || 'ALL'}_${selectedPeriod}.csv`

    downloadFile(content, filename, 'text/csv;charset=utf-8')
    toast('Export Excel/CSV téléchargé avec succès !')
  }

  // Robust Client-Side Browser Parsing Logic (XML, CSV, TXT, JSON)
  const ALLOWED_IMPORT_EXTENSIONS = ['csv', 'txt', 'json', 'xml']

  const parseBrowserFile = (file: File) => {
    setIsProcessing(true)

    // Strict extension validation: a PDF/binary dropped or picked here must
    // never be parsed as text (it previously produced garbage "certificats").
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_IMPORT_EXTENSIONS.includes(ext)) {
      toast(`Format de fichier non pris en charge (.${ext || 'inconnu'}). Formats acceptés : CSV, TXT, XML, JSON.`, 'error')
      setIsProcessing(false)
      return
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
      const text = e.target?.result as string
      const fileName = file.name.toLowerCase()
      const newRecords: ParsedRecord[] = []

      try {
        // Content sniffing: reject PDF headers and NUL bytes (binary data)
        // that FileReader.readAsText would otherwise garble into garbage rows.
        if (text.trim().startsWith('%PDF-') || text.includes('\u0000')) {
          toast('Fichier binaire ou PDF détecté. Veuillez importer un fichier CSV, TXT, XML ou JSON.', 'error')
          setParsedRecords([])
          return
        }

        if (fileName.endsWith('.xml') || text.trim().startsWith('<?xml') || text.includes('<DeclarationsRS') || text.includes('<DeclarationTEJ')) {
          // Official DeclarationsRS XML parsing (round-trip of files generated by this app)
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(text, 'text/xml')

          if (xmlDoc.querySelector('parsererror')) {
            throw new Error('Fichier XML invalide')
          }

          const certNodes = xmlDoc.querySelectorAll('Certificat')

          certNodes.forEach((node, idx) => {
            const mf = node.querySelector('IdTaxpayer > MatriculeFiscal > Identifiant')?.textContent?.trim() || ''
            const cin = node.querySelector('IdTaxpayer > CIN > Identifiant')?.textContent?.trim() || ''
            const nom = node.querySelector('NometprenonOuRaisonsociale')?.textContent?.trim() || `Bénéficiaire ${idx + 1}`
            const adresse = node.querySelector('Adresse')?.textContent?.trim() || ''
            const email = node.querySelector('InfosContact > AdresseMail')?.textContent?.trim() || ''
            const phone = node.querySelector('InfosContact > NumTel')?.textContent?.trim() || ''
            const date = toISODate(node.querySelector('DatePayement')?.textContent?.trim() || '')
            const ref = node.querySelector('Ref_certif_chez_declarant')?.textContent?.trim() || ''

            const operations = node.querySelectorAll('ListeOperations > Operation')

            operations.forEach((op, opIdx) => {
              const code = op.getAttribute('IdTypeOperation') || ''
              const brutMill = parseInt(op.querySelector('MontantHT')?.textContent?.trim() || '0', 10) || 0
              const retenueMill = parseInt(op.querySelector('MontantRS')?.textContent?.trim() || '0', 10) || 0
              const taux = parseFloat(op.querySelector('TauxRS')?.textContent?.trim() || '0') || 0

              if (brutMill <= 0) return

              newRecords.push({
                id: `import-xml-${Date.now()}-${idx}-${opIdx}`,
                date,
                retenuer_name: company?.name || 'Mon Entreprise',
                retenuer_mf: company?.mf || '',
                beneficiaire_name: nom,
                beneficiaire_mf: mf,
                beneficiaire_cin: cin,
                beneficiaire_email: email,
                beneficiaire_phone: phone,
                beneficiaire_address: adresse,
                nature_revenu: natureFromCode(code),
                dgi_code: code,
                montant_brut: brutMill / 1000,
                taux_retenue: taux,
                montant_retenue: retenueMill / 1000,
                facture_number: ref,
              })
            })
          })
        } else if (fileName.endsWith('.json')) {
          // JSON parsing
          const json = JSON.parse(text)
          const items = Array.isArray(json) ? json : (json.items || json.data || [])
          items.forEach((item: any, i: number) => {
            const brut = Number(item.montant_brut || item.brut || item.amount)
            const taux = Number(item.taux_retenue || item.taux)
            if (!Number.isFinite(brut) || brut <= 0 || !Number.isFinite(taux)) return
            const retenue = Number(item.montant_retenue) || (brut * (taux / 100))

            newRecords.push({
              id: `import-json-${Date.now()}-${i}`,
              date: item.date || new Date().toISOString().split('T')[0],
              retenuer_name: item.retenuer_name || company?.name || 'Mon Entreprise',
              retenuer_mf: item.retenuer_mf || company?.mf || '',
              beneficiaire_name: item.beneficiaire_name || item.client || item.fournisseur || `Bénéficiaire ${i + 1}`,
              beneficiaire_mf: item.beneficiaire_mf || item.mf || '',
              beneficiaire_cin: item.beneficiaire_cin || item.cin || '',
              beneficiaire_email: item.beneficiaire_email || '',
              beneficiaire_phone: item.beneficiaire_phone || '',
              beneficiaire_address: item.beneficiaire_address || '',
              nature_revenu: item.nature_revenu || item.nature || 'Honoraires et commissions',
              dgi_code: item.dgi_code || item.code_operation || '',
              montant_brut: brut,
              taux_retenue: taux,
              montant_retenue: retenue,
              facture_number: item.facture_number || item.facture || '',
            })
          })
        } else if (fileName.endsWith('.csv')) {
          // CSV parsing (compatible with the CSV exported by this app).
          // NOTE: previously the fallback `|| text.includes(';')` let PDF/binary
          // files be misread as CSV — removed so only genuine .csv files parse.
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
          const clean = (val?: string) => (val || '').replace(/^["']|["']$/g, '').trim()
          const headerLine = lines[0] || ''
          const hasHeader = /bénéficiaire|beneficiaire|matricule|brut|taux/i.test(headerLine)
          const headerParts = hasHeader ? headerLine.split(';').map((h) => clean(h).toLowerCase()) : []
          const colIndex = (name: string) => headerParts.findIndex((h) => h.includes(name))

          const idxNom = colIndex('bénéficiaire') >= 0 ? colIndex('bénéficiaire') : colIndex('raison sociale') >= 0 ? colIndex('raison sociale') : colIndex('nom')
          const idxId = colIndex('matricule') >= 0 ? colIndex('matricule') : colIndex('cin')
          const idxBrut = colIndex('brut')
          const idxTaux = colIndex('taux')
          const idxRetenue = colIndex('retenue')
          const idxDate = colIndex('date')
          const idxNature = colIndex('nature')
          const idxRef = colIndex('facture')
          const idxAdresse = colIndex('adresse')

          const dataLines = hasHeader ? lines.slice(1) : lines
          dataLines.forEach((line, idx) => {
            if (line.startsWith('0|') || line.startsWith('1|')) return
            const parts = line.split(';')
            const val = (i: number) => (i >= 0 && i < parts.length ? clean(parts[i]) : '')
            const numVal = (i: number) => parseFloat(val(i).replace(/\s/g, ''))

            let bName = ''
            let bId = ''
            let brutVal = 0
            let tauxVal = 0
            let retenueVal = 0
            let dateVal = ''
            let natureVal = 'Honoraires et commissions'
            let refVal = ''
            let adresseVal = ''

            if (hasHeader) {
              bName = val(idxNom)
              bId = val(idxId)
              brutVal = numVal(idxBrut)
              tauxVal = numVal(idxTaux)
              retenueVal = idxRetenue >= 0 ? numVal(idxRetenue) : (brutVal * (tauxVal / 100))
              dateVal = toISODate(val(idxDate))
              natureVal = idxNature >= 0 ? val(idxNature) : natureVal
              refVal = idxRef >= 0 ? val(idxRef) : ''
              adresseVal = idxAdresse >= 0 ? val(idxAdresse) : ''
            } else {
              bName = val(0)
              bId = val(1)
              brutVal = numVal(2)
              tauxVal = numVal(3)
              retenueVal = numVal(4) || (brutVal * (tauxVal / 100))
              dateVal = val(5)
              natureVal = val(6) || natureVal
            }

            if (!Number.isFinite(brutVal) || brutVal <= 0 || !Number.isFinite(tauxVal)) return

            newRecords.push({
              id: `import-csv-${Date.now()}-${idx}`,
              date: dateVal || new Date().toISOString().split('T')[0],
              retenuer_name: company?.name || 'Mon Entreprise',
              retenuer_mf: company?.mf || '',
              beneficiaire_name: bName || `Bénéficiaire ${idx + 1}`,
              beneficiaire_mf: bId.includes('/') || /^\d{7}[A-Z]$/i.test(bId) ? bId : '',
              beneficiaire_cin: /^\d{8}$/.test(bId) ? bId : '',
              beneficiaire_email: '',
              beneficiaire_phone: '',
              beneficiaire_address: adresseVal,
              nature_revenu: natureVal,
              dgi_code: '',
              montant_brut: brutVal,
              taux_retenue: tauxVal,
              montant_retenue: retenueVal,
              facture_number: refVal,
            })
          })
        } else {
          // Pipe-delimited TXT parsing (legacy)
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

          lines.forEach((line, idx) => {
            if (!line.startsWith('1|')) return
            const p = line.split('|')
            const mf = p[2] || ''
            const cin = p[3] || ''
            const nom = p[4] || ''
            const date = p[5] || ''
            const brut = parseFloat(p[7] || '0')
            const taux = parseFloat(p[8] || '0')
            const retenue = parseFloat(p[9] || '0')
            if (!Number.isFinite(brut) || brut <= 0 || !nom) return

            newRecords.push({
              id: `import-txt-${Date.now()}-${idx}`,
              date,
              retenuer_name: company?.name || 'Mon Entreprise',
              retenuer_mf: company?.mf || '',
              beneficiaire_name: nom,
              beneficiaire_mf: mf,
              beneficiaire_cin: cin,
              beneficiaire_email: '',
              beneficiaire_phone: '',
              beneficiaire_address: '',
              nature_revenu: 'Honoraires et commissions',
              dgi_code: p[6] || '',
              montant_brut: brut,
              taux_retenue: taux,
              montant_retenue: retenue,
              facture_number: `RS-TXT-${idx}`,
            })
          })
        }

        if (newRecords.length === 0) {
          toast('Aucun certificat valide n’a pu être extrait de ce fichier. Vérifiez le format.', 'error')
          setParsedRecords([])
          return
        }

        setParsedRecords(newRecords)
        toast(`${newRecords.length} certificat(s) extrait(s) en local dans votre navigateur !`)
      } catch (err) {
        console.error('Browser parsing error:', err)
        toast('Erreur lors du traitement du fichier. Veuillez vérifier le format.', 'error')
      } finally {
        setIsProcessing(false)
      }
    }

    reader.readAsText(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      parseBrowserFile(file)
    }
  }

  // Add Manual Record inside Importer
  const handleAddManualRecord = () => {
    if (!manualName || !manualBrut) {
      toast('Veuillez renseigner au moins le nom et le montant brut', 'error')
      return
    }
    const brut = Number(manualBrut)
    const taux = Number(manualTaux || 15)
    const retenue = (brut * (taux / 100))

    const newRec: ParsedRecord = {
      id: `manual-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      retenuer_name: company?.name || 'Mon Entreprise',
      retenuer_mf: company?.mf || '',
      beneficiaire_name: manualName,
      beneficiaire_mf: manualMf || '',
      beneficiaire_cin: '',
      beneficiaire_email: manualEmail,
      beneficiaire_phone: manualPhone,
      beneficiaire_address: manualAddress,
      nature_revenu: manualNature,
      dgi_code: manualDgiCode,
      montant_brut: brut,
      taux_retenue: taux,
      montant_retenue: retenue,
      facture_number: `FACT-${Date.now().toString().slice(-4)}`,
    }

    setParsedRecords((prev) => [...prev, newRec])
    setManualName('')
    setManualMf('')
    setManualBrut('')
    toast('Ligne ajoutée avec succès !')
  }

  const handleRemoveRecord = (id: string) => {
    setParsedRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const handleDeleteRetenue = async (id: string) => {
    try {
      const res = await fetch(`/app/api/retenues/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast('Certificat de retenue supprimé')
      loadData()
    } catch (err) {
      console.error(err)
      toast('Erreur lors de la suppression', 'error')
    }
  }

  // Save Parsed Records to Database Account & Offer XML Download
  const handleSaveAndGenerateTEJ = async () => {
    if (parsedRecords.length === 0) return

    setIsSaving(true)
    let savedCount = 0

    try {
      for (const rec of parsedRecords) {
        const res = await fetch('/app/api/retenues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: rec.date,
            retenuer_name: rec.retenuer_name,
            retenuer_mf: rec.retenuer_mf,
            beneficiaire_name: rec.beneficiaire_name,
            beneficiaire_mf: rec.beneficiaire_mf,
            beneficiaire_cin: rec.beneficiaire_cin,
            beneficiaire_email: rec.beneficiaire_email,
            beneficiaire_phone: rec.beneficiaire_phone,
            beneficiaire_address: rec.beneficiaire_address,
            natureRevenu: rec.nature_revenu,
            montantBrut: rec.montant_brut,
            tauxRetenue: rec.taux_retenue,
            facture_number: rec.facture_number,
          }),
        })
        if (res.ok) savedCount++
      }

      // Generate Downloadable XML immediately
      const convertedRetenues: Retenue[] = parsedRecords.map((r, idx) => ({
        id: r.id,
        user_id: '',
        number: r.facture_number || `RS-IMP-${idx + 1}`,
        year: yearMonthOf(r.date, currentYear).year,
        month: yearMonthOf(r.date, currentYear).month,
        date: r.date,
        retenuer_name: r.retenuer_name,
        retenuer_mf: r.retenuer_mf,
        beneficiaire_name: r.beneficiaire_name,
        beneficiaire_mf: r.beneficiaire_mf,
        beneficiaire_cin: r.beneficiaire_cin,
        beneficiaire_email: r.beneficiaire_email,
        beneficiaire_phone: r.beneficiaire_phone,
        beneficiaire_address: r.beneficiaire_address,
        nature_revenu: r.nature_revenu,
        dgi_code: r.dgi_code,
        base_legale: 'Art. 52 IRPP/IS',
        montant_brut: r.montant_brut,
        taux_retenue: r.taux_retenue,
        montant_retenue: r.montant_retenue,
        status: 'emis',
        created_at: new Date().toISOString(),
      }))

      const companyMF = company?.mf || '0000000/A/M/000'

      const byMonth = new Map<string, Retenue[]>()
      convertedRetenues.forEach((r) => {
        const { year, month } = yearMonthOf(r.date || '', currentYear)
        const key = `${year}-${month}`
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key)!.push(r)
      })

      byMonth.forEach((records, key) => {
        const [year, month] = key.split('-').map(Number)
        const xmlContent = generateDeclarationsRSXml(records, {
          year,
          month,
          companyMF,
          companyCategory: 'PM',
          companyAddress: company?.address,
          companyEmail: company?.email,
          companyPhone: company?.phone,
        })
        const filename = generateDeclarationsRSFilename(companyMF, year, month, '0')
        downloadFile(xmlContent, filename, 'application/xml;charset=utf-8')
      })

      toast(`Succès ! ${savedCount} retenues enregistrées dans votre compte et ${byMonth.size} fichier(s) XML TEJ officiel(s) téléchargé(s).`)
      setIsImporterOpen(false)
      setParsedRecords([])
      loadData()
    } catch (err) {
      console.error(err)
      toast('Erreur lors de l’enregistrement dans votre compte', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
              <FileOutput className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Export & Conversion Télé-déclaration TEJ (DGI)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Génération des fichiers XML officiels (DeclarationsRS) de Retenue à la Source pour la plateforme TEJ.tn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsImporterOpen(true)} variant="outline" className="border-emerald-500/40 hover:bg-emerald-50 text-emerald-700 font-semibold">
            <Upload className="h-4 w-4 mr-1.5 text-emerald-600" /> Convertir / Saisir des certificats
          </Button>

          <Button onClick={loadData} variant="outline" className="font-semibold" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>

          <Button onClick={handleExportXML} variant="primary" className="bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-sm">
            <FileCode className="h-4 w-4 mr-1.5" /> Fichier XML TEJ (DGI)
          </Button>

          <Button onClick={handleExportCSV} variant="outline" className="font-semibold">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel (.csv)
          </Button>
        </div>
      </div>

      {/* Filter Card - Theme Harmonized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-600" /> Filtres de Sélection
          </span>
          {company?.mf && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Émetteur : {company.mf}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Year Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Année Fiscale
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors"
            >
              <option value={0}>Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>Année Fiscale {y}</option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-600" /> Période / Trimestre
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors"
            >
              <option value="ALL">Année Entière (Jan — Déc)</option>
              <optgroup label="Trimestres">
                <option value="Q1">Trimestre 1 (Janvier — Mars)</option>
                <option value="Q2">Trimestre 2 (Avril — Juin)</option>
                <option value="Q3">Trimestre 3 (Juillet — Septembre)</option>
                <option value="Q4">Trimestre 4 (Octobre — Décembre)</option>
              </optgroup>
              <optgroup label="Mois spécifiques">
                <option value="M1">Janvier</option>
                <option value="M2">Février</option>
                <option value="M3">Mars</option>
                <option value="M4">Avril</option>
                <option value="M5">Mai</option>
                <option value="M6">Juin</option>
                <option value="M7">Juillet</option>
                <option value="M8">Août</option>
                <option value="M9">Septembre</option>
                <option value="M10">Octobre</option>
                <option value="M11">Novembre</option>
                <option value="M12">Décembre</option>
              </optgroup>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-emerald-600" /> Recherche Bénéficiaire
            </label>
            <input
              type="text"
              placeholder="Nom ou Matricule Fiscal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards - Light & Clean Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-1">Nombre de Retenues</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{totals.count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Certificats sélectionnés</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Montant Brut</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {formatNumber(totals.brut)} <span className="text-xs font-normal text-slate-400">TND</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Assiette de calcul</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 mb-1">Total Retenues à la Source</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            {formatNumber(totals.retenue)} <span className="text-xs font-normal text-emerald-700">TND</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">À télé-déclarer (TEJ)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Montant Net Versé</div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600">
            {formatNumber(totals.net)} <span className="text-xs font-normal text-slate-400">TND</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Net versé au bénéficiaire</div>
        </div>
      </div>

      {/* Missing MF Warning Banner */}
      {missingMFCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Attention Conformité DGI :</strong> {missingMFCount} certificat(s) ne possèdent pas de Matricule Fiscal ou CIN du bénéficiaire renseigné. 
            La plateforme TEJ exige un identifiant fiscal valide pour valider le fichier XML.
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">N° Certificat</th>
                    <th className="text-left px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                    <th className="text-left px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Bénéficiaire</th>
                    <th className="text-left px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Matricule Fiscal / CIN</th>
                    <th className="text-left px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Nature Revenu</th>
                    <th className="text-right px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Brut (TND)</th>
                    <th className="text-right px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Taux</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Retenue (TND)</th>
                    <th className="text-center px-3 py-3 font-semibold uppercase tracking-wider text-[11px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRetenues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center space-y-3">
                        <div className="text-slate-400">Aucune retenue enregistrée pour cette période.</div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <Button size="sm" onClick={() => setIsImporterOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                            <Upload className="h-4 w-4 mr-1.5" /> Convertir ou Importer des fichiers
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleGenerateDemoData}>
                            <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" /> Générer 3 exemples de test
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRetenues.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {r.number}
                        </td>
                        <td className="px-3 py-3 text-slate-500">{formatDate(r.date)}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{r.beneficiaire_name}</td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {r.beneficiaire_mf || r.beneficiaire_cin ? (
                            <span className="text-slate-600">{r.beneficiaire_mf || r.beneficiaire_cin}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Manquant
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-xs">{r.nature_revenu}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-900">{formatNumber(r.montant_brut)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-600">{r.taux_retenue}%</td>
                        <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                          {formatNumber(r.montant_retenue)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleDeleteRetenue(r.id)}
                            className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            title="Supprimer ce certificat"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser File Converter & Importer Modal */}
      {isImporterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Outil de Conversion & Télé-déclaration TEJ (DGI)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conversion instantanée et sécurisée 100% navigateur (Client-side)
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsImporterOpen(false); setParsedRecords([]) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file) parseBrowserFile(file)
                }}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-md group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.json,.xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Glissez-déposez ou cliquez pour importer votre fichier
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Prend en charge les fichiers CSV, XML TEJ (DeclarationsRS), TXT et JSON. La plateforme DGI n'accepte que les fichiers XML (format officiel).
                </p>
              </div>

              {/* Quick Manual Entry Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-emerald-600" /> Saisie Rapide d'un Certificat / Retenue
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nom du Bénéficiaire *"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Matricule Fiscal / CIN"
                    value={manualMf}
                    onChange={(e) => setManualMf(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    placeholder="Montant Brut (TND) *"
                    value={manualBrut}
                    onChange={(e) => setManualBrut(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <select
                    value={manualTaux}
                    onChange={(e) => setManualTaux(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  >
                    <option value={15}>15% (Honoraires/Loyers)</option>
                    <option value={1.5}>1.5% (Marchés/Fournitures)</option>
                    <option value={3}>3% (Retenue 3%)</option>
                    <option value={10}>10% (Dividendes/RCM)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nature du revenu"
                    value={manualNature}
                    onChange={(e) => setManualNature(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    placeholder="Email du bénéficiaire"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Téléphone du bénéficiaire"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Adresse du bénéficiaire"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <select
                    value={manualDgiCode}
                    onChange={(e) => setManualDgiCode(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' }}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-2 text-slate-900 outline-none focus:border-emerald-500 lg:col-span-3"
                  >
                    {DGI_OPERATION_CODES.map((op) => (
                      <option key={op.code} value={op.code}>{op.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddManualRecord} variant="secondary" className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter cette ligne
                  </Button>
                </div>
              </div>

              {/* Processing Loader */}
              {isProcessing && (
                <div className="py-8 text-center space-y-3">
                  <LoadingSpinner />
                  <p className="text-xs font-semibold text-slate-600">
                    Analyse et conversion du fichier en local...
                  </p>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedRecords.length > 0 && !isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {parsedRecords.length} certificat(s) prêt(s) pour la télé-déclaration TEJ :
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Génèrera le XML TEJ Officiel
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2.5 font-semibold text-slate-600">Bénéficiaire</th>
                          <th className="text-left p-2.5 font-semibold text-slate-600">Matricule Fiscal</th>
                          <th className="text-right p-2.5 font-semibold text-slate-600">Brut</th>
                          <th className="text-right p-2.5 font-semibold text-slate-600">Taux</th>
                          <th className="text-right p-2.5 font-semibold text-slate-600">Retenue</th>
                          <th className="p-2.5 text-center font-semibold text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-medium text-slate-900">{rec.beneficiaire_name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{rec.beneficiaire_mf || rec.beneficiaire_cin || <span className="text-amber-600 font-semibold">Manquant</span>}</td>
                            <td className="p-2.5 text-right font-medium">{formatNumber(rec.montant_brut)} TND</td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">{rec.taux_retenue}%</td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">{formatNumber(rec.montant_retenue)} TND</td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleRemoveRecord(rec.id)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      En cliquant sur valider, un fichier <strong>XML officiel DGI</strong> (format DeclarationsRS, nommé <code>MATRICULE-EXERCICE-MOIS-0.xml</code>) sera généré et téléchargé par mois, et les données seront sauvegardées sur votre compte Factarlou.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => { setIsImporterOpen(false); setParsedRecords([]) }}
                disabled={isSaving}
              >
                Annuler
              </Button>

              {parsedRecords.length > 0 && (
                <Button
                  onClick={handleSaveAndGenerateTEJ}
                  loading={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Télécharger XML TEJ & Enregistrer dans mon compte
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
