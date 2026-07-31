'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, AlertCircle } from 'lucide-react'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'
import type { Document } from '@/types'

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''

  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="bg-white border border-border-color rounded-xl p-12 text-center space-y-4">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 rounded-lg text-text-muted hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{doc.number || 'Doc'}</h1>
              <Badge color={getDocTypeColor(docType)}>{DOC_TYPE_LABELS[docType] || docType}</Badge>
              <Badge color={getPaymentStatusColor(paymentStatus)}>
                {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">
              {doc.client_name || 'Client'} · {formatDate(doc.date)} · {formatCurrency(doc.total_ttc || 0, doc.currency || 'TND')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
