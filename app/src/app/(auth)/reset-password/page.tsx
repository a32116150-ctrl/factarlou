'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, KeyRound, AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let settled = false

    const settle = (valid: boolean) => {
      if (!settled) {
        settled = true
        setValidSession(valid)
        setChecking(false)
      }
    }

    // 1. Listen for PASSWORD_RECOVERY event (fires when Supabase processes recovery tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        settle(true)
      } else if (event === 'SIGNED_IN' && session) {
        settle(true)
      }
    })

    // 2. Check if URL contains a PKCE code (shouldn't normally happen since callback handles it, but safety net)
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          settle(true)
          // Clean up the URL
          window.history.replaceState({}, '', window.location.pathname)
        }
      })
    }

    // 3. Check if we already have a valid session (set by the callback route via cookies)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settle(true)
      }
    })

    // 4. Give a short grace period for auth state changes to process, then decide
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        settle(Boolean(session))
      })
    }, 1500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast('Le mot de passe doit contenir au moins 6 caractères', 'error')
      return
    }
    if (password !== confirmPassword) {
      toast('Les mots de passe ne correspondent pas', 'error')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast(error.message, 'error')
      return
    }

    setSuccess(true)
    toast('Votre mot de passe a été réinitialisé avec succès !')
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  if (success) {
    return (
      <AuthCard>
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-text">Mot de passe réinitialisé !</h2>
          <p className="text-xs text-text-muted">
            Votre nouveau mot de passe a été enregistré avec succès. Vous allez être redirigé vers votre tableau de bord...
          </p>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full">Accéder à mon tableau de bord</Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    )
  }

  if (checking) {
    return (
      <AuthCard>
        <div className="text-center space-y-4 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-text-muted">Vérification de votre session...</p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Nouveau mot de passe</h2>
          <p className="text-xs text-text-muted">Création de votre nouveau mot de passe</p>
        </div>
      </div>

      {validSession === false && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Information :</strong> Votre lien a peut-être expiré ou est invalide. Vous pouvez{' '}
            <Link href="/forgot-password" className="underline font-bold">
              demander un nouveau lien ici
            </Link>.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          id="password"
          label="Nouveau mot de passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          id="confirmPassword"
          label="Confirmer le nouveau mot de passe"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Enregistrer le nouveau mot de passe
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-text-muted">
        <Link href="/login" className="text-primary hover:text-primary-dark font-semibold">
          ← Se connecter
        </Link>
      </p>
    </AuthCard>
  )
}
