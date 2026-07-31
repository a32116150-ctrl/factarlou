'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

interface CompanyForm {
  name: string
  mf: string
  address: string
  phone: string
  email: string
  rc: string
  website: string
  bank: string
  rib: string
  logo_image: string
  stamp_image: string
  signature_image: string
  show_logo: boolean
  show_stamp: boolean
  show_signature: boolean
  show_qr: boolean
  show_accent: boolean
}

const emptyForm: CompanyForm = {
  name: '', mf: '', address: '', phone: '', email: '', rc: '', website: '', bank: '', rib: '',
  logo_image: '', stamp_image: '', signature_image: '',
  show_logo: true, show_stamp: true, show_signature: true, show_qr: false, show_accent: true,
}

export default function CompanySettingsPage() {
  const { toast } = useToast()
  const [form, setForm] = useState<CompanyForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('companies').select('*').eq('user_id', user.id).maybeSingle()
    if (data) {
      setForm({ ...emptyForm, ...data })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const update = (patch: Partial<CompanyForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const uploadImage = async (field: 'logo_image' | 'stamp_image' | 'signature_image', file: File) => {
    if (!userId) return
    const ext = file.name.split('.').pop() || 'png'
    const path = `${userId}/${field}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true })
    if (error) {
      toast(error.message, 'error')
      return
    }
    const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path)
    update({ [field]: urlData.publicUrl })
    toast('Image téléchargée')
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/app/api/companies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast('Entreprise enregistrée')
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur', 'error')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-text-muted">Chargement...</div>
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Informations légales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nom de l'entreprise" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Matricule Fiscal" value={form.mf} onChange={(e) => update({ mf: e.target.value })} />
          <Input label="Adresse" value={form.address} onChange={(e) => update({ address: e.target.value })} />
          <Input label="Téléphone" value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          <Input label="Registre de Commerce" value={form.rc} onChange={(e) => update({ rc: e.target.value })} />
          <Input label="Site web" value={form.website} onChange={(e) => update({ website: e.target.value })} />
          <Input label="Banque" value={form.bank} onChange={(e) => update({ bank: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="IBAN / RIB" value={form.rib} onChange={(e) => update({ rib: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Logo, cachet et signature</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { field: 'logo_image', label: 'Logo', show: 'show_logo' as const },
            { field: 'stamp_image', label: 'Cachet', show: 'show_stamp' as const },
            { field: 'signature_image', label: 'Signature', show: 'show_signature' as const },
          ] as const).map(({ field, label, show }) => (
            <div key={field} className="space-y-2">
              {form[field] && (
                <img src={form[field]} alt={label} className="h-20 object-contain bg-white rounded-lg p-1" />
              )}
              <label className="block text-xs font-medium text-text-secondary">{label}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadImage(field, f)
                }}
                className="text-xs text-text-muted"
              />
              <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[show]}
                  onChange={(e) => update({ [show]: e.target.checked })}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                Afficher sur les documents
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}
