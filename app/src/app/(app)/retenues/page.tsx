'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Eye, Printer, ArrowLeftRight } from 'lucide-react'
import type { Retenue } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatNumber } from '@/lib/formatters'

export default function RetenuesPage() {
  const { toast } = useToast()
  const [retenues, setRetenues] = useState<Retenue[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Retenue | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/app/api/retenues')
    if (res.ok) {
      const json = await res.json()
      setRetenues(json.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/app/api/retenues/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Retenue supprimée')
      setDeleteTarget(null)
      load()
    } else {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Retenues à la source</h1>
          <p className="text-xs sm:text-sm text-text-muted">{retenues.length} retenue(s) enregistrée(s)</p>
        </div>
        <Link href="/retenues/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouvelle retenue</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {/* Mobile swipe helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 md:hidden">
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
              Glissez horizontalement pour faire défiler le tableau
            </span>
          </div>

          {/* Desktop Table View (≥ md) */}
          <div className="hidden md:block bg-white border border-border-color rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border-light bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">N°</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Date</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Payeur</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Bénéficiaire</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase">Taux</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase">Montant brut</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase">Retenue</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {retenues.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">Aucune retenue trouvée.</td>
                    </tr>
                  )}
                  {retenues.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-primary">
                        <Link href={`/retenues/${r.id}`} className="hover:underline">
                          {r.number}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-text-muted">{formatDate(r.date)}</td>
                      <td className="px-3 py-3 text-text-secondary font-medium">{r.retenuer_name}</td>
                      <td className="px-3 py-3 text-text-secondary">{r.beneficiaire_name}</td>
                      <td className="px-3 py-3 text-right font-medium text-text-secondary">{r.taux_retenue}%</td>
                      <td className="px-3 py-3 text-right text-text-secondary">{formatNumber(r.montant_brut)} TND</td>
                      <td className="px-3 py-3 text-right font-bold text-blue-900 dark:text-blue-400">{formatNumber(r.montant_retenue)} TND</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/retenues/${r.id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                            title="Voir / Imprimer Retenue"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-danger cursor-pointer transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {retenues.length === 0 && (
              <div className="bg-white border border-border-color rounded-xl p-8 text-center text-text-muted">
                Aucune retenue trouvée.
              </div>
            )}
            {retenues.map((r) => (
              <div key={r.id} className="bg-white border border-border-color rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/retenues/${r.id}`} className="text-base font-extrabold text-primary hover:underline">
                      {r.number}
                    </Link>
                    <div className="text-xs text-text-muted mt-0.5">Date : {formatDate(r.date)}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-900">
                      Taux : {r.taux_retenue}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-text-secondary bg-slate-50 p-2.5 rounded-lg">
                  <div><strong>Payeur :</strong> {r.retenuer_name}</div>
                  <div><strong>Bénéficiaire :</strong> {r.beneficiaire_name}</div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-text-muted">Brut : {formatNumber(r.montant_brut)} TND</span>
                  <span className="text-sm font-black text-blue-900">Retenue : {formatNumber(r.montant_retenue)} TND</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                  <Link href={`/retenues/${r.id}`} className="flex-1">
                    <Button size="xs" variant="outline" className="w-full flex items-center justify-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Aperçu Retenue
                    </Button>
                  </Link>
                  <Button size="xs" variant="danger" onClick={() => setDeleteTarget(r)} className="shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la retenue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Voulez-vous vraiment supprimer l&apos;attestation de retenue <strong className="text-text">{deleteTarget?.number}</strong> ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
