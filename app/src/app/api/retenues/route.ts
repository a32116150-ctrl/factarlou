import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('retenues')
    .select('*')
    .order('date', { ascending: false })

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

  if (!body.date || !body.retenuer_name || !body.beneficiaire_name) {
    return NextResponse.json({ error: 'date, retenuer_name, beneficiaire_name required' }, { status: 400 })
  }

  const montantBrut = Number(body.montantBrut || 0)
  const taux = Number(body.tauxRetenue || 1.5)
  const montantRetenue = Math.round(montantBrut * (taux / 100) * 1000) / 1000

  const year = Number(body.date.split('-')[0])
  const month = Number(body.date.split('-')[1])
  const number = `RS-${year}-${String(month).padStart(2, '0')}-${String(Date.now()).slice(-4)}`

  const { data, error } = await supabase
    .from('retenues')
    .insert({
      user_id: user.id,
      number,
      year,
      month,
      date: body.date,
      retenuer_name: body.retenuer_name,
      retenuer_mf: body.retenuer_mf || null,
      retenuer_address: body.retenuer_address || null,
      retenuer_rc: body.retenuer_rc || null,
      retenuer_rep: body.retenuer_rep || null,
      retenuer_code_tva: body.retenuer_code_tva || null,
      retenuer_code_cat: body.retenuer_code_cat || null,
      retenuer_n_etab: body.retenuer_n_etab || null,
      beneficiaire_name: body.beneficiaire_name,
      beneficiaire_mf: body.beneficiaire_mf || null,
      beneficiaire_address: body.beneficiaire_address || null,
      beneficiaire_rib: body.beneficiaire_rib || null,
      beneficiaire_cin: body.beneficiaire_cin || null,
      beneficiaire_code_tva: body.beneficiaire_code_tva || null,
      beneficiaire_code_cat: body.beneficiaire_code_cat || null,
      beneficiaire_n_etab: body.beneficiaire_n_etab || null,
      facture_id: body.facture_id || null,
      facture_number: body.facture_number || null,
      facture_date: body.facture_date || null,
      montant_brut: montantBrut,
      taux_retenue: taux,
      montant_retenue: montantRetenue,
      nature_revenu: body.natureRevenu || 'Honoraires et commissions',
      base_legale: body.baseLegale || 'Art. 52 du Code de l\'IRPP et de l\'IS',
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
