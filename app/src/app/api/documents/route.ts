import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import { validateDocSave } from '@/lib/validate'
import { calculateTotals } from '@/lib/math-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('payment_status', status)
  if (q) query = query.or(`number.ilike.%${q}%,client_name.ilike.%${q}%`)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const settingsRes = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  const settings = settingsRes.data

  const companyRes = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  const company = companyRes.data

  const prefixMap: Record<string, string> = {
    facture: 'FAC',
    devis: 'DEV',
    bon: 'BC',
    avoir: 'AV',
    bl: 'BL',
    ba: 'BA',
    bs: 'BS',
    be: 'BE',
    ticket: 'TIC',
    proforma: 'PRF',
    forfaitaire: 'FAC',
  }
  const prefix = settings?.[`prefix_${body.type}` as keyof typeof settings]
    ? String(settings[`prefix_${body.type}` as keyof typeof settings])
    : (prefixMap[body.type] || 'DOC')

  const number = await generateNumberWithRetry(supabase, user.id, body.type, prefix)
  if (!number) {
    return NextResponse.json({ error: 'Failed to generate document number' }, { status: 500 })
  }

  const items = (body.items || []).map((it: { description: string; quantity: string | number; price: string | number; tva?: string | number; unit?: string }) => ({
    description: it.description,
    quantity: Number(it.quantity),
    price: Number(it.price),
    tva: Number(it.tva || 0),
    unit: it.unit || 'unité',
  }))

  const totals = calculateTotals(items, {
    applyTimbre: Boolean(body.applyTimbre),
    discountPercent: Number(body.discountPercent || 0),
    discountAmount: Number(body.discountAmount || 0),
    decimalPlaces: settings?.decimal_places ?? 3,
    roundingMethod: settings?.rounding_method ?? 'half_up',
  })

  const validationData = {
    userId: user.id,
    type: body.type,
    number,
    date: body.date,
    clientName: body.clientName,
    currency: body.currency || 'TND',
    paymentMode: body.paymentMode,
    discountPercent: Number(body.discountPercent || 0),
    discountAmount: Number(body.discountAmount || 0),
    items,
  }

  const errors = validateDocSave(validationData)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const dueDate = body.type === 'devis' ? add30Days(body.date) : body.dueDate

  const insertData = {
    user_id: user.id,
    type: body.type,
    number,
    date: body.date,
    due_date: dueDate || null,
    currency: body.currency || 'TND',
    payment_mode: body.paymentMode || null,
    payment_status: 'unpaid',
    paid_amount: 0,
    company_name: company?.name || null,
    company_mf: company?.mf || null,
    company_address: company?.address || null,
    company_phone: company?.phone || null,
    company_email: company?.email || null,
    company_rc: company?.rc || null,
    client_id: body.clientId || null,
    client_name: body.clientName,
    client_mf: body.clientMF || null,
    client_address: body.clientAddress || null,
    client_phone: body.clientPhone || null,
    client_email: body.clientEmail || null,
    items_json: items,
    apply_timbre: Boolean(body.applyTimbre),
    timbre_amount: totals.timbreAmount,
    fodec_rate: 0,
    rounding_adjustment: totals.roundingAdjustment,
    discount_percent: Number(body.discountPercent || 0),
    discount_amount: Number(body.discountAmount || 0),
    total_ht: totals.totalHT,
    total_tva: totals.totalTVA,
    total_ttc: totals.totalTTC,
    logo_image: company?.logo_image || null,
    stamp_image: company?.stamp_image || null,
    signature_image: company?.signature_image || null,
    notes: body.notes || null,
    internal_notes: body.internalNotes || null,
    is_pos: false,
  }

  const { data, error } = await supabase.from('documents').insert(insertData).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'document',
    entity_id: data.id,
    entity_label: `${data.type} ${data.number}`,
  })

  return NextResponse.json({ data }, { status: 201 })
}

async function generateNumberWithRetry(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  prefix: string
): Promise<string | null> {
  const year = new Date().getFullYear()
  const { data, error } = await supabase.rpc('increment_doc_counter', {
    p_user_id: userId,
    p_type: type,
    p_year: year,
  })
  if (error || typeof data !== 'number') return null
  return `${prefix}-${year}-${String(data).padStart(4, '0')}`
}

function add30Days(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + 30)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
