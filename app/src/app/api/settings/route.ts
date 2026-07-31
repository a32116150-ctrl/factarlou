import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import { validateSettings } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!settings) {
    const { data: created } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single()
    return NextResponse.json({ data: created })
  }
  return NextResponse.json({ data: settings })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const errors = validateSettings(body)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const allowed = [
    'prefix_facture', 'prefix_devis', 'prefix_bon', 'prefix_retenue', 'prefix_avoir',
    'prefix_contract', 'prefix_bl', 'prefix_ba', 'prefix_bs', 'prefix_be', 'prefix_ticket',
    'decimal_places', 'rounding_method', 'document_theme', 'currency_default',
    'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
  ]

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, ...update })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
