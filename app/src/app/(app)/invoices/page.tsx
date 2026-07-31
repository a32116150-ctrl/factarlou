'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Printer, Pencil, Copy, Trash2, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import type { Document, DocType, PaymentStatus } from '@/types'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'

function getDocTypeColor(type: DocType): 'primary' | 'secondary' | 'success' | 'warning' | 'info' {
  switch (type) {
    case 'facture': return 'primary'
    case 'devis': return 'info'
    case 'proforma': return 'secondary'
    case 'avoir': return 'warning'
    default: return 'secondary'
  }
}

function getPaymentStatusColor(status: PaymentStatus): 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'paid': return 'success'
    case 'unpaid': return 'danger'
    case 'partial': return 'warning'
  }
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/app/api/documents?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setDocs(json.data || [])
    }
    setLoading(false)
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchDocs, 300)
    return () => clearTimeout(timer)
  }, [fetchDocs])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/app/api/documents/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast('Document supprimé')
      setDeleteTarget(null)
      fetchDocs()
    } else {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Documents</h1>
          <p className="text-xs sm:text-sm text-text-muted">{docs.length} document(s) enregistré(s)</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau document</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Rechercher (n°, client)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-text-muted" />}
        />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="facture">Facture</option>
          <option value="devis">Devis</option>
          <option value="proforma">Proforma</option>
          <option value="avoir">Avoir</option>
          <option value="bon">Bon de commande</option>
          <option value="bl">Bon de livraison</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="paid">Payé</option>
          <option value="unpaid">Non payé</option>
          <option value="partial">Partiel</option>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {/* Visual Swipe Banner for Tablet/Mobile Table view */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 md:hidden">
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
              Glissez horizontalement pour faire défiler le tableau
            </span>
          </div>

          {/* Desktop Table View (≥ md) */}
          <div className="hidden md:block bg-white border border-border-color rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-border-light bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">N°</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Type</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Client</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Date</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Échéance</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase">TTC</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Actions</th>
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
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-primary">
                        <Link href={`/invoices/${doc.id}`} className="hover:underline">
                          {doc.number}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
                      </td>
                      <td className="px-3 py-3 text-text-secondary font-medium">{doc.client_name}</td>
                      <td className="px-3 py-3 text-text-muted">{formatDate(doc.date)}</td>
                      <td className="px-3 py-3 text-text-muted">{formatDate(doc.due_date)}</td>
                      <td className="px-3 py-3 text-right font-bold text-text">
                        {formatCurrency(doc.total_ttc, doc.currency)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge color={getPaymentStatusColor(doc.payment_status)}>
                          {PAYMENT_STATUS_LABELS[doc.payment_status] || doc.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/invoices/${doc.id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                            title="Aperçu / Voir document"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/invoices/${doc.id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                            title="Imprimer / Exporter PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/invoices/${doc.id}/edit`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/invoices/new?type=${doc.type}`}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                            title="Dupliquer"
                          >
                            <Copy className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(doc)}
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

          {/* Mobile Responsive Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {docs.length === 0 && (
              <div className="bg-white border border-border-color rounded-xl p-8 text-center text-text-muted">
                Aucun document trouvé.
              </div>
            )}
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white border border-border-color rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link href={`/invoices/${doc.id}`} className="text-base font-extrabold text-primary hover:underline">
                      {doc.number}
                    </Link>
                    <div className="text-xs text-text-secondary font-medium mt-0.5">{doc.client_name || 'Client anonyme'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
                    <Badge color={getPaymentStatusColor(doc.payment_status)}>
                      {PAYMENT_STATUS_LABELS[doc.payment_status] || doc.payment_status}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-text-muted">Émis le {formatDate(doc.date)}</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(doc.total_ttc, doc.currency)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                  <Link href={`/invoices/${doc.id}`} className="flex-1">
                    <Button size="xs" variant="outline" className="w-full flex items-center justify-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Voir
                    </Button>
                  </Link>
                  <Link href={`/invoices/${doc.id}`} className="flex-1">
                    <Button size="xs" variant="outline" className="w-full flex items-center justify-center gap-1">
                      <Printer className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </Link>
                  <Link href={`/invoices/${doc.id}/edit`} className="flex-1">
                    <Button size="xs" variant="outline" className="w-full flex items-center justify-center gap-1">
                      <Pencil className="h-3.5 w-3.5" /> Éditer
                    </Button>
                  </Link>
                  <Button size="xs" variant="ghost" onClick={() => setDeleteTarget(doc)} className="text-red-600">
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
