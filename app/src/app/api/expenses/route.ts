import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import { validateExpenseSave } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const amountHT = Number(body.amountHT || 0)
  const amountTTC = Number(body.amountTTC || 0)
  const tvaRate = Number(body.tvaRate || 0)

  const errors = validateExpenseSave({
    userId: user.id,
    date: body.date,
    vendor: body.vendor,
    amountHT,
    amountTTC,
    tvaRate,
  })
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      date: body.date,
      vendor: body.vendor || null,
      category: body.category || null,
      description: body.description || null,
      amount_ht: amountHT,
      tva_rate: tvaRate,
      amount_ttc: amountTTC,
      retenue_source: Number(body.retenueSource || 0),
      payment_method: body.paymentMethod || null,
      reference: body.reference || null,
      doc_type: body.docType || 'facture',
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
