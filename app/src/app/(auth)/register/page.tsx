'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AuthCard } from '@/components/auth/AuthCard'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [company, setCompany] = useState('')
  const [mf, setMf] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast('Veuillez remplir les champs obligatoires', 'error')
      return
    }
    if (password.length < 8) {
      toast('Le mot de passe doit contenir au moins 8 caractères', 'error')
      return
    }
    if (password !== confirm) {
      toast('Les mots de passe ne correspondent pas', 'error')
      return
    }
    if (mf) {
      const cleaned = mf.trim().toUpperCase()
      const valid = /^\d{7}\/[A-Z]\/[A-Z]\/\d{3}$/.test(cleaned) || /^\d{7}[A-Z][A-Z]\d{3}$/.test(cleaned)
      if (!valid) {
        toast('Matricule Fiscal invalide (ex: 1234567/A/M/000)', 'error')
        return
      }
    }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company: company || null,
          mf: mf || null,
        },
        emailRedirectTo: `${window.location.origin}/app/api/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    if (data.session) {
      toast('Compte créé avec succès')
      router.push('/dashboard')
      router.refresh()
    } else {
      toast('Compte créé. Vérifiez votre email pour confirmer.', 'info')
      router.push('/confirm-email')
    }
  }

  return (
    <AuthCard
      tabs={[
        { href: '/login', label: 'Connexion' },
        { href: '/register', label: 'Inscription' },
      ]}
    >
      <h2 className="text-lg font-semibold text-text mb-1">Créer un compte</h2>
      <p className="text-sm text-text-muted mb-5">Commencez à facturer en quelques minutes</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          id="name"
          label="Nom complet"
          placeholder="Votre nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="Min 8 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            id="confirm"
            label="Confirmer"
            type="password"
            placeholder="Répéter"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Input
          id="company"
          label="Entreprise (optionnel)"
          placeholder="Raison sociale"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <Input
          id="mf"
          label="Matricule Fiscal (optionnel)"
          placeholder="1234567/A/M/000"
          value={mf}
          onChange={(e) => setMf(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          S&apos;inscrire
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  )
}
