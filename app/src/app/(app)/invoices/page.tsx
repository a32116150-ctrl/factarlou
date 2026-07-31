'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Trash2, Eye } from 'lucide-react'
import type { Document } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'

const DOC_TYPES = ['facture', 'devis', 'bon', 'avoir', 'bl', 'ba', 'bs', 'be', 'ticket', 'proforma', 'forfaitaire']

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [status, setStatus] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    params.set('limit', '100')

    const res = await fetch(`/app/api/documents?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setDocs(json.data || [])
    } else {
      toast('Erreur lors du chargement', 'error')
    }
    setLoading(false)
  }, [q, type, status, toast])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/app/api/documents/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast('Document supprimé')
      setDeleteTarget(null)
      load()
    } else {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Documents</h1>
          <p className="text-sm text-text-muted">{docs.length} document(s)</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Nouveau document</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Rechercher (n°, client)..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setLoading(true) }}
            className="pl-9"
          />
        </div>
        <Select value={type} onChange={(e) => { setType(e.target.value); setLoading(true) }}>
          <option value="">Tous les types</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setLoading(true) }}>
          <option value="">Tous les statuts</option>
          <option value="unpaid">Impayé</option>
          <option value="paid">Payé</option>
          <option value="partial">Partiel</option>
        </Select>
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
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Client</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Échéance</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">TTC</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                      Aucun document trouvé.
                    </td>
                  </tr>
                )}
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{doc.number}</td>
                    <td className="px-3 py-3">
                      <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{doc.client_name}</td>
                    <td className="px-3 py-3 text-text-muted">{formatDate(doc.date)}</td>
                    <td className="px-3 py-3 text-text-muted">{formatDate(doc.due_date)}</td>
                    <td className="px-3 py-3 text-right font-medium text-text">
                      {formatCurrency(doc.total_ttc, doc.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge color={getPaymentStatusColor(doc.payment_status)}>
                        {PAYMENT_STATUS_LABELS[doc.payment_status] || doc.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/invoices/${doc.id}`}
                          className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-primary"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer"
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
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Voulez-vous vraiment supprimer le document <strong className="text-text">{deleteTarget?.number}</strong> ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
