import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !doc) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 rounded-lg text-text-muted hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{doc.number}</h1>
              <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
              <Badge color={getPaymentStatusColor(doc.payment_status)}>
                {PAYMENT_STATUS_LABELS[doc.payment_status] || doc.payment_status}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">
              {doc.client_name} · {formatDate(doc.date)} · {formatCurrency(doc.total_ttc, doc.currency)}
            </p>
          </div>
        </div>
      </div>
      <InvoicePDF doc={doc} />
    </div>
  )
}
