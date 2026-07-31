'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, KeyRound, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 1. Check if URL contains PKCE ?code=...
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          setValidSession(true)
        }
      })
    }

    // 2. Listen for recovery session or auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidSession(true)
      }
    })

    // 3. Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      } else if (!code) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            setValidSession(Boolean(s))
          })
        }, 800)
      }
    })

    return () => {
      subscription.unsubscribe()
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
            <strong>Information :</strong> Si le formulaire échoue, votre lien a peut-être expiré. Vous pouvez{' '}
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
