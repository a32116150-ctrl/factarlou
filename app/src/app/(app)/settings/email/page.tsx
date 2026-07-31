'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function EmailSettingsPage() {
  const { toast } = useToast()
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/app/api/settings')
    if (res.ok) {
      const json = await res.json()
      const s = json.data
      setSmtpHost(s?.smtp_host || '')
      setSmtpPort(String(s?.smtp_port || 587))
      setSmtpUser(s?.smtp_user || '')
      setSmtpPass(s?.smtp_pass || '')
      setSmtpSecure(Boolean(s?.smtp_secure))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/app/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp_host: smtpHost || null,
        smtp_port: Number(smtpPort || 587),
        smtp_user: smtpUser || null,
        smtp_pass: smtpPass || null,
        smtp_secure: smtpSecure,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast('Paramètres email enregistrés')
    } else {
      toast('Erreur lors de l\'enregistrement', 'error')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    const res = await fetch('/app/api/email/test', { method: 'POST' })
    setTesting(false)
    if (res.ok) {
      toast('Connexion SMTP réussie')
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Échec de connexion SMTP', 'error')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-text-muted">Chargement...</div>
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Serveur SMTP</h2>
        <p className="text-xs text-text-muted">
          Utilisé pour envoyer les factures et relances par email. Les identifiants sont stockés de manière sécurisée et ne sont jamais affichés en clair dans l&apos;interface.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Hôte SMTP" placeholder="smtp.exemple.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
          <Input label="Port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
          <Input label="Utilisateur" placeholder="contact@entreprise.tn" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
          <Input label="Mot de passe" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} autoComplete="new-password" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={smtpSecure}
            onChange={(e) => setSmtpSecure(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          Utiliser SSL/TLS
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleTest} loading={testing}>Tester la connexion</Button>
        <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}
