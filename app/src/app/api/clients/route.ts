import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import { validateClientSave } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category')

  let query = supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (q) query = query.or(`name.ilike.%${q}%,mf.ilike.%${q}%,email.ilike.%${q}%`)
  if (category) query = query.eq('category', category)

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

  const errors = validateClientSave({
    userId: user.id,
    name: body.name,
    mf: body.mf,
    email: body.email,
    phone: body.phone,
  })
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: body.name,
      mf: body.mf || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      credit_limit: Number(body.creditLimit || 0),
      category: body.category || 'standard',
      rib: body.rib || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
