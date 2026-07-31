import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'

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

  const tva = Number(body.tva)
  if (body.tva !== undefined && ![0, 7, 13, 19].includes(tva)) {
    return NextResponse.json({ error: 'tva: must be 0, 7, 13, or 19' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .update({
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price || 0),
      tva: body.tva !== undefined ? tva : undefined,
      category: body.category ?? null,
      unit: body.unit ?? 'unité',
      barcode: body.barcode ?? null,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      min_stock: body.minStock !== undefined ? Number(body.minStock) : undefined,
    })
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
    .from('services')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
