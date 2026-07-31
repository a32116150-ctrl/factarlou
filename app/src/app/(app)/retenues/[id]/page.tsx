import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RetenuePDF } from '@/components/pdf/RetenuePDF'
import { Badge, getRetenueStatusColor } from '@/components/ui/Badge'
import { formatDate, formatNumber, RETENUE_STATUS_LABELS } from '@/lib/formatters'

export default async function RetenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: retenue, error } = await supabase
    .from('retenues')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !retenue) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/retenues" className="p-2 rounded-lg text-text-muted hover:bg-gray-100 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text">Retenue {retenue.number}</h1>
            <Badge color={getRetenueStatusColor(retenue.status)}>
              {RETENUE_STATUS_LABELS[retenue.status] || retenue.status}
            </Badge>
          </div>
          <p className="text-sm text-text-muted">
            {retenue.retenuer_name} → {retenue.beneficiaire_name} · {formatDate(retenue.date)} · {formatNumber(retenue.montant_retenue)} TND
          </p>
        </div>
      </div>
      <RetenuePDF retenue={retenue} />
    </div>
  )
}
