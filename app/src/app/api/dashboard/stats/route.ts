import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import type { DashboardStats, Document } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]

  const today = new Date().toISOString().split('T')[0]

  const [invoicesRes, clientsRes, monthDocsRes, unpaidRes, expensesRes, recentRes, overdueRes] = await Promise.all([
    supabase.from('documents').select('total_ttc,payment_status').eq('type', 'facture'),
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('total_ttc').eq('type', 'facture').eq('payment_status', 'paid').gte('date', monthStart).lt('date', nextMonth),
    supabase.from('documents').select('total_ttc').neq('payment_status', 'paid'),
    supabase.from('expenses').select('amount_ttc').gte('date', monthStart).lt('date', nextMonth),
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('documents').select('id').eq('payment_status', 'unpaid').lt('due_date', today),
  ])

  const allInvoices = invoicesRes.data || []
  const monthPaid = (monthDocsRes.data || []).reduce((sum: number, d: { total_ttc?: number | null }) => sum + (d.total_ttc || 0), 0)
  const unpaid = (unpaidRes.data || []).reduce((sum: number, d: { total_ttc?: number | null }) => sum + (d.total_ttc || 0), 0)
  const expenses = (expensesRes.data || []).reduce((sum: number, e: { amount_ttc?: number | null }) => sum + (e.amount_ttc || 0), 0)

  const stats: DashboardStats = {
    revenue: monthPaid,
    totalInvoices: allInvoices.length,
    totalClients: clientsRes.count || 0,
    pendingAmount: unpaid,
    totalExpenses: expenses,
    netProfit: monthPaid - expenses,
    recentDocs: (recentRes.data as Document[]) || [],
    overdueCount: overdueRes.data?.length || 0,
  }

  return NextResponse.json(stats)
}
