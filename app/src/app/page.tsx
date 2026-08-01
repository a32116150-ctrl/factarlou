import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface RootPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RootPage({ searchParams }: RootPageProps) {
  const params = await searchParams
  const code = typeof params.code === 'string' ? params.code : undefined
  const token_hash = typeof params.token_hash === 'string' ? params.token_hash : undefined
  const type = typeof params.type === 'string' ? params.type : undefined
  const next = typeof params.next === 'string' ? params.next : undefined

  // 1. If URL contains recovery parameters, forward to reset-password via auth callback
  if (type === 'recovery' || (next && next.includes('reset-password'))) {
    const q = new URLSearchParams()
    q.set('next', '/reset-password')
    if (code) q.set('code', code)
    if (token_hash) q.set('token_hash', token_hash)
    if (type) q.set('type', type)
    redirect(`/api/auth/callback?${q.toString()}`)
  }

  // 2. If URL contains any auth callback code or token_hash, route to callback
  if (code || token_hash) {
    const q = new URLSearchParams()
    if (code) q.set('code', code)
    if (token_hash) q.set('token_hash', token_hash)
    if (type) q.set('type', type)
    if (next) q.set('next', next)
    redirect(`/api/auth/callback?${q.toString()}`)
  }

  // 3. Otherwise check user session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/login')
}
