import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/api-helpers'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await requireUser(supabase)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  if (!body.to || !body.subject) {
    return NextResponse.json({ error: 'to and subject required' }, { status: 400 })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure')
    .eq('user_id', user.id)
    .maybeSingle()

  if (settingsError || !settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_pass) {
    return NextResponse.json({ error: 'SMTP settings not configured' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: Boolean(settings.smtp_secure),
      auth: { user: settings.smtp_user, pass: settings.smtp_pass },
    })

    await transporter.sendMail({
      from: settings.smtp_user,
      to: body.to,
      subject: body.subject,
      html: body.body || '',
    })

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'email_sent',
      entity_type: 'email',
      entity_label: body.to,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Email failed' }, { status: 500 })
  }
}
