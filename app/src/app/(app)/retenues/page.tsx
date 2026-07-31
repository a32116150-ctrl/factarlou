'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Retenues à la source</h1>
          <p className="text-sm text-text-muted">{retenues.length} retenue(s)</p>
        </div>
        <Link href="/retenues/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Nouvelle retenue</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-border-color rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">N°</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Payeur</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Bénéficiaire</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">Taux</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">Montant brut</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">Retenue</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {retenues.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-text-muted">Aucune retenue trouvée.</td>
                  </tr>
                )}
                {retenues.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{r.number}</td>
                    <td className="px-3 py-3 text-text-muted">{formatDate(r.date)}</td>
                    <td className="px-3 py-3 text-text-secondary">{r.retenuer_name}</td>
                    <td className="px-3 py-3 text-text-secondary">{r.beneficiaire_name}</td>
                    <td className="px-3 py-3 text-right text-text-secondary">{r.taux_retenue}%</td>
                    <td className="px-3 py-3 text-right text-text-secondary">{formatNumber(r.montant_brut)}</td>
                    <td className="px-3 py-3 text-right font-medium text-text">{formatNumber(r.montant_retenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/retenues/${r.id}`}
                          className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-primary"
                          title="Voir / Imprimer"
                        >
                          PDF
                        </Link>
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer" title="Supprimer">
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
          Supprimer la retenue <strong className="text-text">{deleteTarget?.number}</strong> ?
        </p>
      </Modal>
    </div>
  )
}
