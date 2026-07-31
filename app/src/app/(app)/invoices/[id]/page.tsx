'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, AlertCircle, CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'
import type { Document, PaymentStatus } from '@/types'

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const { toast } = useToast()

  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(true)
      return
    }

    let active = true
    fetch(`/app/api/documents/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((json) => {
        if (active) {
          const documentData = json.data || json
          if (documentData && typeof documentData.items_json === 'string') {
            try {
              documentData.items_json = JSON.parse(documentData.items_json)
            } catch {
              documentData.items_json = []
            }
          }
          setDoc(documentData)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const handleUpdateStatus = async (newStatus: PaymentStatus) => {
    if (!doc) return
    setUpdatingStatus(true)
    const res = await fetch(`/app/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus }),
    })
    setUpdatingStatus(false)
    if (res.ok) {
      setDoc((prev) => (prev ? { ...prev, payment_status: newStatus } : prev))
      toast(`Statut mis à jour : ${PAYMENT_STATUS_LABELS[newStatus] || newStatus}`)
    } else {
      toast('Erreur lors de la mise à jour du statut', 'error')
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="bg-white border border-border-color rounded-xl p-8 sm:p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-warning mx-auto" />
        <h2 className="text-xl font-bold text-text">Document introuvable</h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Le document demandé n&apos;existe pas ou vous n&apos;avez pas l&apos;autorisation d&apos;y accéder.
        </p>
        <Link href="/invoices">
          <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Retour aux documents</Button>
        </Link>
      </div>
    )
  }

  const docType = doc.type || 'facture'
  const paymentStatus = doc.payment_status || 'unpaid'

  return (
    <div className="space-y-4">
      {/* Mobile-Friendly Top Detail Card with Quick Status Change Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-border-color shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/invoices" className="p-2 rounded-lg text-text-muted hover:bg-gray-100 cursor-pointer shrink-0 mt-0.5 sm:mt-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-extrabold text-text tracking-tight whitespace-nowrap">
                {doc.number || 'Doc'}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge color={getDocTypeColor(docType)}>{DOC_TYPE_LABELS[docType] || docType}</Badge>
                <Badge color={getPaymentStatusColor(paymentStatus)}>
                  {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
                </Badge>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1 truncate">
              {doc.client_name || 'Client'} · {formatDate(doc.date)} · <strong className="text-text font-semibold">{formatCurrency(doc.total_ttc || 0, doc.currency || 'TND')}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-light shrink-0">
          {/* Quick Status Control Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('paid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Marquer comme Payée"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Payé
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('partial')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                paymentStatus === 'partial'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Marquer comme Paiement Partiel"
            >
              <Clock className="h-3.5 w-3.5" /> Partiel
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('unpaid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                paymentStatus === 'unpaid'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-red-700 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Marquer comme Impayée"
            >
              <CreditCard className="h-3.5 w-3.5" /> Impayé
            </button>
          </div>

          <Link href={`/invoices/${doc.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
          </Link>
        </div>
      </div>

      <InvoicePDF doc={doc} />
    </div>
  )
}
