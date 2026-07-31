'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AuthCard } from '@/components/auth/AuthCard'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast('Veuillez remplir tous les champs', 'error')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message, 'error')
      return
    }
    toast('Connexion réussie')
    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/api/auth/callback`,
      },
    })
    if (error) {
      setGoogleLoading(false)
      toast(error.message, 'error')
    }
  }

  return (
    <AuthCard
      tabs={[
        { href: '/login', label: 'Connexion' },
        { href: '/register', label: 'Inscription' },
      ]}
    >
      <h2 className="text-lg font-semibold text-text mb-1">Se connecter</h2>
      <p className="text-sm text-text-muted mb-5">Accédez à votre espace de facturation</p>

      {/* Google OAuth Sign in Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        loading={googleLoading}
        className="w-full flex items-center justify-center border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold mb-4"
      >
        <GoogleIcon /> Continuer avec Google
      </Button>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        <span className="flex-shrink mx-3 text-xs text-text-muted uppercase font-medium">ou avec email</span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="vous@entreprise.tn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-primary hover:text-primary-dark font-semibold">
          S&apos;inscrire
        </Link>
      </p>
    </AuthCard>
  )
}
