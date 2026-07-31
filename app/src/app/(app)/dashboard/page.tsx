import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, FileText, Users, AlertCircle, ShoppingCart, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/formatters'
import type { Document } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const [invoicesRes, clientsRes, monthPaidRes, unpaidRes, expensesRes, recentRes, overdueRes] = await Promise.all([
    supabase.from('documents').select('total_ttc,payment_status').eq('type', 'facture'),
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('total_ttc').eq('type', 'facture').eq('payment_status', 'paid').gte('date', monthStart).lt('date', nextMonth),
    supabase.from('documents').select('total_ttc').neq('payment_status', 'paid'),
    supabase.from('expenses').select('amount_ttc').gte('date', monthStart).lt('date', nextMonth),
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('documents').select('id').eq('payment_status', 'unpaid').lt('due_date', today),
  ])

  const revenue = (monthPaidRes.data || []).reduce((s: number, d: { total_ttc?: number | null }) => s + (d.total_ttc || 0), 0)
  const totalInvoices = (invoicesRes.data || []).length
  const totalClients = clientsRes.count || 0
  const pendingAmount = (unpaidRes.data || []).reduce((s: number, d: { total_ttc?: number | null }) => s + (d.total_ttc || 0), 0)
  const totalExpenses = (expensesRes.data || []).reduce((s: number, e: { amount_ttc?: number | null }) => s + (e.amount_ttc || 0), 0)
  const netProfit = revenue - totalExpenses
  const recentDocs = (recentRes.data as Document[]) || []
  const overdueCount = overdueRes.data?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Tableau de bord</h1>
          <p className="text-sm text-text-muted">
            {overdueCount > 0 ? `${overdueCount} facture(s) en retard de paiement` : 'Aucune facture en retard'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new?type=facture">
            <Button size="sm">+ Nouvelle Facture</Button>
          </Link>
          <Link href="/invoices/new?type=devis">
            <Button size="sm" variant="outline">+ Nouveau Devis</Button>
          </Link>
          <Link href="/retenues/new">
            <Button size="sm" variant="outline">+ Nouvelle Retenue</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Chiffre d'affaires (mois)" value={formatCurrency(revenue, 'TND', 0)} icon={<TrendingUp className="h-4 w-4" />} color="blue" />
        <StatCard title="Factures émises" value={totalInvoices} icon={<FileText className="h-4 w-4" />} color="purple" />
        <StatCard title="Clients actifs" value={totalClients} icon={<Users className="h-4 w-4" />} color="green" />
        <StatCard title="Impayés en cours" value={formatCurrency(pendingAmount, 'TND', 0)} icon={<AlertCircle className="h-4 w-4" />} color="red" />
        <StatCard title="Dépenses (mois)" value={formatCurrency(totalExpenses, 'TND', 0)} icon={<ShoppingCart className="h-4 w-4" />} color="orange" />
        <StatCard title="Bénéfice net" value={formatCurrency(netProfit, 'TND', 0)} icon={<Wallet className="h-4 w-4" />} color="teal" />
      </div>

      <RecentDocuments docs={recentDocs} />
    </div>
  )
}
