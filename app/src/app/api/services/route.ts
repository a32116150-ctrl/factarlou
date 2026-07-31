import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  let query = supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (q) query = query.ilike('name', `%${q}%`)

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

  if (!body.name) {
    return NextResponse.json({ error: 'name: required' }, { status: 400 })
  }

  const tva = Number(body.tva)
  if (![0, 7, 13, 19].includes(tva)) {
    return NextResponse.json({ error: 'tva: must be 0, 7, 13, or 19' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      user_id: user.id,
      name: body.name,
      description: body.description || null,
      price: Number(body.price || 0),
      tva,
      category: body.category || null,
      unit: body.unit || 'unité',
      barcode: body.barcode || null,
      stock: Number(body.stock || 0),
      min_stock: Number(body.minStock || 0),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
