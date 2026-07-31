import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  // Always bypass middleware for API routes and static files
  const path = request.nextUrl.pathname
  if (path.includes('/api/')) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  let user = null
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Supabase middleware error:', e)
  }

  const isAuthPage =
    path.includes('/login') ||
    path.includes('/register') ||
    path.includes('/forgot-password') ||
    path.includes('/reset-password') ||
    path.includes('/confirm-email') ||
    path.includes('/auth-code-error') ||
    path.includes('/auth')

  // If user is not authenticated and not on an auth page, redirect to login
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/app/login', request.url))
  }

  // If user is authenticated and visits login/register, redirect to dashboard (except reset-password)
  if (user && isAuthPage && !path.includes('/reset-password')) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
