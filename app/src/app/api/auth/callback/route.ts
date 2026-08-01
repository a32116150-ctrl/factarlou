import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

  // For recovery flow, always go to reset-password
  if (type === 'recovery' || next.includes('reset-password')) {
    next = '/reset-password'
  }

  const targetUrl = `${origin}/app${next}`

  // Create the redirect response FIRST so we can attach cookies to it
  const redirectResponse = NextResponse.redirect(targetUrl)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

  // Create Supabase client that writes cookies directly onto the redirect response
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Case 1: PKCE Code Flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('exchangeCodeForSession error:', error)
      // Even on error, redirect to reset-password if that was the intent
      if (next === '/reset-password') {
        return redirectResponse
      }
      // On error, redirect to auth error page
      return NextResponse.redirect(`${origin}/app/auth-code-error`)
    }
    return redirectResponse
  }

  // Case 2: Email OTP Token Hash Flow (Recovery / Email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (error) {
      console.error('verifyOtp error:', error)
      if (next === '/reset-password') {
        return redirectResponse
      }
      return NextResponse.redirect(`${origin}/app/auth-code-error`)
    }
    return redirectResponse
  }

  // Fallback: redirect to target
  return redirectResponse
}
