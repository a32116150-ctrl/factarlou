'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AuthCard } from '@/components/auth/AuthCard'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <AuthCard
      tabs={[
        { href: '/login', label: 'Connexion' },
        { href: '/register', label: 'Inscription' },
      ]}
    >
      <h2 className="text-lg font-semibold text-text mb-1">Se connecter</h2>
      <p className="text-sm text-text-muted mb-5">Accédez à votre espace de facturation</p>

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
