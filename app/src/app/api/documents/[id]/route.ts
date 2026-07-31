import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import { calculateTotals } from '@/lib/math-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const rawItems = body.items || body.items_json
  const validItems = Array.isArray(rawItems)
    ? rawItems.map((it: any) => ({
        description: String(it.description || ''),
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        tva: Number(it.tva) || 0,
        unit: String(it.unit || 'unité'),
      }))
    : []

  const update: Record<string, unknown> = {
    type: body.type,
    date: body.date,
    due_date: body.dueDate || body.due_date || null,
    currency: body.currency || 'TND',
    payment_mode: body.paymentMode || body.payment_mode || null,
    client_id: body.clientId || body.client_id || null,
    client_name: body.clientName || body.client_name || '',
    client_mf: body.clientMF || body.client_mf || null,
    client_address: body.clientAddress || body.client_address || null,
    client_phone: body.clientPhone || body.client_phone || null,
    client_email: body.clientEmail || body.client_email || null,
    items_json: validItems,
    apply_timbre: Boolean(body.applyTimbre ?? body.apply_timbre),
    discount_percent: Number(body.discountPercent || body.discount_percent || 0),
    discount_amount: Number(body.discountAmount || body.discount_amount || 0),
    notes: body.notes || null,
    internal_notes: body.internalNotes || body.internal_notes || null,
  }

  // Remove undefined properties
  Object.keys(update).forEach((key) => {
    if (update[key] === undefined) delete update[key]
  })

  // Recalculate document totals if items exist
  if (validItems.length > 0) {
    const totals = calculateTotals(validItems as any, {
      applyTimbre: Boolean(update.apply_timbre),
      discountPercent: Number(update.discount_percent || 0),
      discountAmount: Number(update.discount_amount || 0),
    })
    update.total_ht = totals.totalHT
    update.total_tva = totals.totalTVA
    update.total_ttc = totals.totalTTC
    update.timbre_amount = totals.timbreAmount
    update.rounding_adjustment = totals.roundingAdjustment
  }

  const { data, error } = await supabase
    .from('documents')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
