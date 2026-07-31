'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast('Veuillez saisir votre email', 'error')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/api/auth/callback?next=/app/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    toast('Si cet email existe, un lien de réinitialisation a été envoyé.', 'info')
  }

  return (
    <AuthCard>
      <h2 className="text-lg font-semibold text-text mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-text-muted mb-5">
        Saisissez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" loading={loading} className="w-full">
          Envoyer le lien
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
