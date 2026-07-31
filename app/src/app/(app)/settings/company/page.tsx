'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { ImageUploadField } from '@/components/company/ImageUploadField'

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
    // Append timestamp to bust browser cache
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
    update({ [field]: publicUrl })
    toast('Image mise à jour avec succès')
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
      toast(json.error || 'Erreur lors de l\'enregistrement', 'error')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-text-muted">Chargement...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text">Informations légales de l&apos;entreprise</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom / Raison Sociale" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Matricule Fiscal" value={form.mf} onChange={(e) => update({ mf: e.target.value })} />
          <Input label="Adresse physique" value={form.address} onChange={(e) => update({ address: e.target.value })} />
          <Input label="Téléphone" value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          <Input label="Email de contact" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          <Input label="Registre de Commerce (RC)" value={form.rc} onChange={(e) => update({ rc: e.target.value })} />
          <Input label="Site web" value={form.website} onChange={(e) => update({ website: e.target.value })} />
          <Input label="Nom de la Banque" value={form.bank} onChange={(e) => update({ bank: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="IBAN / RIB bancaire" value={form.rib} onChange={(e) => update({ rib: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">Logo, Cachet et Signature</h2>
          <p className="text-xs text-text-muted mt-0.5">Ces visuels apparaîtront sur vos factures, devis et attestations de retenue</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ImageUploadField
            label="Logo"
            imageUrl={form.logo_image}
            showOnDocs={form.show_logo}
            onImageChange={(f) => uploadImage('logo_image', f)}
            onImageRemove={() => update({ logo_image: '' })}
            onToggleShowOnDocs={(val) => update({ show_logo: val })}
          />
          <ImageUploadField
            label="Cachet"
            imageUrl={form.stamp_image}
            showOnDocs={form.show_stamp}
            onImageChange={(f) => uploadImage('stamp_image', f)}
            onImageRemove={() => update({ stamp_image: '' })}
            onToggleShowOnDocs={(val) => update({ show_stamp: val })}
          />
          <ImageUploadField
            label="Signature"
            imageUrl={form.signature_image}
            showOnDocs={form.show_signature}
            onImageChange={(f) => uploadImage('signature_image', f)}
            onImageRemove={() => update({ signature_image: '' })}
            onToggleShowOnDocs={(val) => update({ show_signature: val })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} loading={saving} size="lg" className="px-8 font-semibold">Enregistrer les modifications</Button>
      </div>
    </div>
  )
}
