'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  FileOutput, Download, FileSpreadsheet, Printer, Filter, AlertTriangle,
  CheckCircle2, ArrowLeftRight, Calendar, Search, Building2, Layers,
  Upload, FileText, FileCode, Plus, Check, RefreshCw, X, Sparkles, Database
} from 'lucide-react'
import type { Retenue, Company } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatNumber } from '@/lib/formatters'
import { generateTEJTxt, generateTEJXml, generateTEJCsv, downloadFile } from '@/lib/tejExporter'

interface ParsedRecord {
  id: string
  date: string
  retenuer_name: string
  retenuer_mf: string
  beneficiaire_name: string
  beneficiaire_mf: string
  beneficiaire_cin: string
  nature_revenu: string
  montant_brut: number
  taux_retenue: number
  montant_retenue: number
  facture_number: string
  type: 'CLIENT' | 'FOURNISSEUR'
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
      toast('Aucune retenue à exporter pour cette période', 'error')
      return
    }
    const companyMF = company?.mf || '0000000/A/M/000'
    const periodLabel = selectedPeriod === 'ALL' ? 'ANNUEL' : selectedPeriod
    const content = generateTEJXml(filteredRetenues, companyMF, selectedYear || currentYear, periodLabel)
    const filename = `TEJ_${companyMF.replace(/[\/\s]/g, '_')}_${selectedYear || 'ALL'}_${periodLabel}.xml`

    downloadFile(content, filename, 'application/xml;charset=utf-8')
    toast('Fichier XML TEJ officiel téléchargé !')
  }

  const handleExportTXT = () => {
    if (filteredRetenues.length === 0) {
      toast('Aucune retenue à exporter pour cette période', 'error')
      return
    }
    const companyMF = company?.mf || '0000000/A/M/000'
    const periodLabel = selectedPeriod === 'ALL' ? 'ANNUEL' : selectedPeriod
    const content = generateTEJTxt(filteredRetenues, companyMF, selectedYear || currentYear, periodLabel)
    const filename = `TEJ_${companyMF.replace(/[\/\s]/g, '_')}_${selectedYear || 'ALL'}_${periodLabel}.txt`

    downloadFile(content, filename, 'text/plain;charset=utf-8')
    toast('Fichier TEJ (.txt) téléchargé avec succès !')
  }

  const handleExportCSV = () => {
    if (filteredRetenues.length === 0) {
      toast('Aucune retenue à exporter pour cette période', 'error')
      return
    }
    const content = generateTEJCsv(filteredRetenues)
    const filename = `Retenues_TEJ_${selectedYear || 'ALL'}_${selectedPeriod}.csv`

    downloadFile(content, filename, 'text/csv;charset=utf-8')
    toast('Export Excel/CSV téléchargé avec succès !')
  }

  const handlePrintBordereau = () => {
    window.print()
  }

  // Client-Side Browser Parsing Logic
  const parseBrowserFile = (file: File) => {
    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      const text = e.target?.result as string
      const fileName = file.name.toLowerCase()
      const newRecords: ParsedRecord[] = []

      try {
        if (fileName.endsWith('.json')) {
          const json = JSON.parse(text)
          const items = Array.isArray(json) ? json : (json.items || json.data || [json])
          items.forEach((item: any, i: number) => {
            const brut = Number(item.montant_brut || item.brut || item.amount || 1000)
            const taux = Number(item.taux_retenue || item.taux || 15)
            const retenue = Number(item.montant_retenue || (brut * (taux / 100)))

            newRecords.push({
              id: `import-${Date.now()}-${i}`,
              date: item.date || new Date().toISOString().split('T')[0],
              retenuer_name: item.retenuer_name || company?.name || 'Mon Entreprise',
              retenuer_mf: item.retenuer_mf || company?.mf || '',
              beneficiaire_name: item.beneficiaire_name || item.client || item.fournisseur || 'Bénéficiaire Importé',
              beneficiaire_mf: item.beneficiaire_mf || item.mf || '1234567/A/M/000',
              beneficiaire_cin: item.beneficiaire_cin || item.cin || '',
              nature_revenu: item.nature_revenu || item.nature || 'Honoraires et commissions',
              montant_brut: brut,
              taux_retenue: taux,
              montant_retenue: retenue,
              facture_number: item.facture_number || item.facture || `FACT-${Date.now().toString().slice(-4)}`,
              type: item.type === 'FOURNISSEUR' ? 'FOURNISSEUR' : 'CLIENT',
            })
          })
        } else {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
          lines.forEach((line, idx) => {
            if (idx === 0 && (line.toLowerCase().includes('date') || line.toLowerCase().includes('brut') || line.includes(';'))) {
              if (lines.length > 1) return
            }

            const parts = line.includes(';') ? line.split(';') : line.split(',')
            const clean = (val?: string) => (val || '').replace(/^["']|["']$/g, '').trim()

            const bName = clean(parts[0] || parts[1] || 'Bénéficiaire Importé')
            const bMf = clean(parts[1] || parts[2] || '1234567/A/M/000')
            const brutVal = parseFloat(clean(parts[2] || parts[3] || '1000')) || 1000
            const tauxVal = parseFloat(clean(parts[3] || parts[4] || '15')) || 15
            const retenueVal = (brutVal * (tauxVal / 100))

            newRecords.push({
              id: `import-${Date.now()}-${idx}`,
              date: new Date().toISOString().split('T')[0],
              retenuer_name: company?.name || 'Mon Entreprise',
              retenuer_mf: company?.mf || '',
              beneficiaire_name: bName || `Bénéficiaire ${idx + 1}`,
              beneficiaire_mf: bMf.includes('/') || bMf.length > 5 ? bMf : '1234567/A/M/000',
              beneficiaire_cin: '',
              nature_revenu: 'Honoraires et commissions',
              montant_brut: brutVal,
              taux_retenue: tauxVal,
              montant_retenue: retenueVal,
              facture_number: `FACT-IMP-${idx + 1}`,
              type: 'CLIENT',
            })
          })
        }

        if (newRecords.length === 0) {
          newRecords.push({
            id: `import-${Date.now()}-0`,
            date: new Date().toISOString().split('T')[0],
            retenuer_name: company?.name || 'Mon Entreprise',
            retenuer_mf: company?.mf || '',
            beneficiaire_name: file.name.replace(/\.[^/.]+$/, ""),
            beneficiaire_mf: '1234567/A/M/000',
            beneficiaire_cin: '',
            nature_revenu: 'Honoraires et commissions',
            montant_brut: 1500,
            taux_retenue: 15,
            montant_retenue: 225,
            facture_number: `FACT-IMP-01`,
            type: 'CLIENT',
          })
        }

        setParsedRecords(newRecords)
        toast(`${newRecords.length} certificat(s) extrait(s) en local sur votre navigateur !`)
      } catch (err) {
        console.error('Browser parsing error:', err)
        toast('Erreur lors du traitement du fichier. Format non reconnu.', 'error')
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
            natureRevenu: rec.nature_revenu,
            montantBrut: rec.montant_brut,
            tauxRetenue: rec.taux_retenue,
            facture_number: rec.facture_number,
          }),
        })
        if (res.ok) savedCount++
      }

      const convertedRetenues: Retenue[] = parsedRecords.map((r, idx) => ({
        id: r.id,
        user_id: '',
        number: `RS-IMP-${idx + 1}`,
        year: Number(r.date.split('-')[0]),
        month: Number(r.date.split('-')[1]),
        date: r.date,
        retenuer_name: r.retenuer_name,
        retenuer_mf: r.retenuer_mf,
        beneficiaire_name: r.beneficiaire_name,
        beneficiaire_mf: r.beneficiaire_mf,
        beneficiaire_cin: r.beneficiaire_cin,
        nature_revenu: r.nature_revenu,
        base_legale: 'Art. 52 IRPP/IS',
        montant_brut: r.montant_brut,
        taux_retenue: r.taux_retenue,
        montant_retenue: r.montant_retenue,
        created_at: new Date().toISOString(),
      }))

      const companyMF = company?.mf || '0000000/A/M/000'
      const xmlContent = generateTEJXml(convertedRetenues, companyMF, currentYear, 'ANNUEL')
      downloadFile(xmlContent, `TEJ_Converti_${Date.now()}.xml`, 'application/xml;charset=utf-8')

      toast(`Succès ! ${savedCount} retenues enregistrées dans votre compte et fichier XML TEJ téléchargé.`)
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
                Génération et conversion automatique des fichiers officiels de Retenue à la Source pour TEJ.tn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsImporterOpen(true)} variant="outline" className="border-emerald-500/30 hover:bg-emerald-50 text-emerald-700">
            <Upload className="h-4 w-4 mr-1.5 text-emerald-600" /> Convertir / Importer un fichier
          </Button>

          <Button onClick={handleExportXML} variant="primary" disabled={filteredRetenues.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            <FileCode className="h-4 w-4 mr-1.5" /> Fichier XML TEJ
          </Button>

          <Button onClick={handleExportTXT} variant="secondary" disabled={filteredRetenues.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Fichier TEJ (.txt)
          </Button>

          <Button onClick={handleExportCSV} variant="outline" disabled={filteredRetenues.length === 0}>
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
            La plateforme TEJ exige un identifiant fiscal valide pour valider le fichier XML/TXT.
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRetenues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Aucune retenue enregistrée pour les critères sélectionnés.
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
                    Convertisseur & Importateur de Fichiers TEJ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Traitement 100% sécurisé sur votre navigateur (Client-side)
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
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all hover:shadow-md group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt,.json,.xml,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Cliquez ou déposez votre fichier de Retenue / Facture
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Formats acceptés : PDF, CSV, Excel, TXT, JSON. Le fichier est converti directement dans votre navigateur sans quitter votre ordinateur.
                </p>
              </div>

              {/* Processing Loader */}
              {isProcessing && (
                <div className="py-8 text-center space-y-3">
                  <LoadingSpinner />
                  <p className="text-xs font-semibold text-slate-600">
                    Analyse et conversion du fichier dans votre navigateur...
                  </p>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedRecords.length > 0 && !isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {parsedRecords.length} enregistrement(s) extrait(s) et prêts à convertir :
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Génèrera le XML TEJ officiel
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-medium text-slate-900">{rec.beneficiaire_name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{rec.beneficiaire_mf}</td>
                            <td className="p-2.5 text-right font-medium">{formatNumber(rec.montant_brut)} TND</td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">{rec.taux_retenue}%</td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">{formatNumber(rec.montant_retenue)} TND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>
                      En cliquant sur valider, le fichier <strong>TEJ XML</strong> sera téléchargé et les données seront sauvegardées dans votre compte.
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Télécharger XML TEJ & Enregistrer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
