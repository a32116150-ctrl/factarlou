import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  let next = searchParams.get('next') ?? '/dashboard'

  // Clean up next parameter formatting
  if (next.startsWith('/app/')) {
    next = next.substring(4)
  }
  if (!next.startsWith('/')) {
    next = `/${next}`
  }

  const targetUrl = `${origin}/app${next}`

  const supabase = await createClient()

  // Case 1: PKCE Code Flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(targetUrl)
    }
    console.error('exchangeCodeForSession error:', error)
  }

  // Case 2: Email OTP Token Hash Flow (Recovery / Email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(targetUrl)
    }
    console.error('verifyOtp error:', error)
  }

  // Case 3: Recovery fallback
  if (type === 'recovery' || next.includes('reset-password')) {
    return NextResponse.redirect(`${origin}/app/reset-password`)
  }

  return NextResponse.redirect(targetUrl)
}
