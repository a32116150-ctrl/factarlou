'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

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

    toast('Votre mot de passe a été réinitialisé avec succès !')
    router.push('/login')
  }

  return (
    <AuthCard>
      <h2 className="text-lg font-semibold text-text mb-1">Nouveau mot de passe</h2>
      <p className="text-sm text-text-muted mb-5">
        Veuillez saisir votre nouveau mot de passe ci-dessous.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Mettre à jour le mot de passe
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-muted">
        <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  )
}
