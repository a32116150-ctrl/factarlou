'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileOutput, Download, FileSpreadsheet, Printer, Filter, AlertTriangle,
  CheckCircle2, ArrowLeftRight, Calendar, Search, Building2, Layers
} from 'lucide-react'
import type { Retenue, Company } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatNumber } from '@/lib/formatters'
import { generateTEJTxt, generateTEJCsv, downloadFile } from '@/lib/tejExporter'

export default function ExportTEJPage() {
  const { toast } = useToast()
  const [retenues, setRetenues] = useState<Retenue[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

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
      // Year filter
      const rYear = r.year || (r.date ? new Date(r.date).getFullYear() : currentYear)
      if (selectedYear !== 0 && rYear !== selectedYear) return false

      // Period filter
      if (selectedPeriod !== 'ALL' && r.date) {
        const dateObj = new Date(r.date)
        const month = dateObj.getMonth() + 1 // 1..12

        if (selectedPeriod === 'Q1' && !(month >= 1 && month <= 3)) return false
        if (selectedPeriod === 'Q2' && !(month >= 4 && month <= 6)) return false
        if (selectedPeriod === 'Q3' && !(month >= 7 && month <= 9)) return false
        if (selectedPeriod === 'Q4' && !(month >= 10 && month <= 12)) return false

        // Month specific M01..M12
        if (selectedPeriod.startsWith('M')) {
          const mNum = parseInt(selectedPeriod.replace('M', ''), 10)
          if (month !== mNum) return false
        }
      }

      // Search Query
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
    toast('Fichier Excel/CSV (.csv) téléchargé avec succès !')
  }

  const handlePrintBordereau = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileOutput className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text">Export Télé-déclaration TEJ (DGI)</h1>
              <p className="text-xs sm:text-sm text-text-muted">
                Génération des fichiers officiels de Retenue à la Source pour la plateforme TEJ.tn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportTXT} variant="primary" disabled={filteredRetenues.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Fichier TEJ (.txt)
          </Button>
          <Button onClick={handleExportCSV} variant="secondary" disabled={filteredRetenues.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export Excel (.csv)
          </Button>
          <Button onClick={handlePrintBordereau} variant="outline" className="hidden sm:inline-flex" disabled={filteredRetenues.length === 0}>
            <Printer className="h-4 w-4 mr-1.5" /> Bordereau PDF
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-slate-900 border border-border-color rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" /> Filtres de Sélection
          </span>
          {company?.mf && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-text-secondary flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Émetteur : {company.mf}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Year Selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Année Fiscale
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full text-xs sm:text-sm rounded-xl border border-border-color bg-white dark:bg-slate-800 px-3 py-2 text-text font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value={0}>Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>Année Fiscale {y}</option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Période / Trimestre
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-border-color bg-white dark:bg-slate-800 px-3 py-2 text-text font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
            <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <Search className="h-3.5 w-3.5" /> Recherche Bénéficiaire
            </label>
            <input
              type="text"
              placeholder="Nom ou Matricule Fiscal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-border-color bg-white dark:bg-slate-800 px-3 py-2 text-text font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-border-color rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-text-muted mb-1">Nombre de Retenues</div>
          <div className="text-xl sm:text-2xl font-extrabold text-text">{totals.count}</div>
          <div className="text-[11px] text-text-muted mt-1">Certificats sélectionnés</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border-color rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-text-muted mb-1">Total Montant Brut</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            {formatNumber(totals.brut)} <span className="text-xs font-normal text-text-muted">TND</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1">Assiette de calcul</div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Total Retenues à la Source</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatNumber(totals.retenue)} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-500">TND</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">À télé-déclarer (TEJ)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border-color rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-text-muted mb-1">Total Montant Net Versé</div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatNumber(totals.net)} <span className="text-xs font-normal text-text-muted">TND</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1">Net versé au bénéficiaire</div>
        </div>
      </div>

      {/* Missing MF Warning Banner */}
      {missingMFCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Attention Conformité DGI :</strong> {missingMFCount} certificat(s) ne possèdent pas de Matricule Fiscal ou CIN du bénéficiaire renseigné. 
            La plateforme TEJ exige un identifiant fiscal valide pour valider le fichier.
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {/* Mobile Swipe Notice */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 md:hidden">
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-600" />
              Faites glisser pour consulter le détail des retenues
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border-color rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border-light bg-slate-50 dark:bg-slate-800/80 text-text-muted">
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
                <tbody className="divide-y divide-border-light">
                  {filteredRetenues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        Aucune retenue enregistrée pour les critères sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredRetenues.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {r.number}
                        </td>
                        <td className="px-3 py-3 text-text-muted">{formatDate(r.date)}</td>
                        <td className="px-3 py-3 font-medium text-text">{r.beneficiaire_name}</td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {r.beneficiaire_mf || r.beneficiaire_cin ? (
                            <span className="text-text-secondary">{r.beneficiaire_mf || r.beneficiaire_cin}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Manquant
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-text-muted text-xs">{r.nature_revenu}</td>
                        <td className="px-3 py-3 text-right font-medium text-text">{formatNumber(r.montant_brut)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{r.taux_retenue}%</td>
                        <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
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
    </div>
  )
}
