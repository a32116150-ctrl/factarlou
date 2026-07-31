import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Pencil, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams?.id

  if (!id) {
    return (
      <div className="bg-white border border-border-color rounded-xl p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-text">Document non spécifié</h2>
        <Link href="/invoices">
          <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Retour aux documents</Button>
        </Link>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let doc = null
  try {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    doc = data
  } catch (e) {
    console.error('Error fetching document:', e)
  }

  if (!doc) {
    return (
      <div className="bg-white border border-border-color rounded-xl p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-warning mx-auto" />
        <h2 className="text-xl font-bold text-text">Document introuvable</h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Le document demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Link href="/invoices">
          <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Retour aux documents</Button>
        </Link>
      </div>
    )
  }

  // Parse items_json safely
  if (typeof doc.items_json === 'string') {
    try {
      doc.items_json = JSON.parse(doc.items_json)
    } catch {
      doc.items_json = []
    }
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
