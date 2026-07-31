'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast('Veuillez saisir votre email', 'error')
      return
    }
    setLoading(true)
    const supabase = createClient()
    
    // Direct redirect to reset-password page for recovery flow
    const redirectTo = `${window.location.origin}/app/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    setLoading(false)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('429')) {
        toast('Pour des raisons de sécurité, veuillez patienter 60 secondes avant de demander un nouvel email.', 'warning')
      } else {
        toast(error.message, 'error')
      }
      return
    }
    setSent(true)
    toast('Un lien de réinitialisation vous a été envoyé par email')
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-text">Vérifiez vos emails</h2>
          <p className="text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
            Nous avons envoyé un lien de réinitialisation sécurisé à <strong className="text-text">{email}</strong>.
            Cliquez sur le lien dans l&apos;email pour choisir votre nouveau mot de passe.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour à la connexion
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <h2 className="text-lg font-bold text-text mb-1">Mot de passe oublié</h2>
      <p className="text-xs text-text-muted mb-5">
        Saisissez l&apos;adresse email associée à votre compte Factarlou pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Adresse Email"
          type="email"
          placeholder="votre-email@entreprise.tn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Envoyer le lien de réinitialisation
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-text-muted">
        <Link href="/login" className="text-primary hover:text-primary-dark font-semibold">
          ← Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  )
}
