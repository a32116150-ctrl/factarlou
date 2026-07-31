'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { todayISO } from '@/lib/formatters'
import { RETENUE_RATES } from '@/lib/constants'

export default function NewRetenuePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [date, setDate] = useState(todayISO())
  const [retenuerName, setRetenuerName] = useState('')
  const [retenuerMf, setRetenuerMf] = useState('')
  const [retenuerAddress, setRetenuerAddress] = useState('')
  const [retenuerRc, setRetenuerRc] = useState('')
  const [retenuerRep, setRetenuerRep] = useState('')
  const [retenuerCodeTva, setRetenuerCodeTva] = useState('')
  const [retenuerCodeCat, setRetenuerCodeCat] = useState('')
  const [retenuerNEtab, setRetenuerNEtab] = useState('')
  const [beneficiaireName, setBeneficiaireName] = useState('')
  const [beneficiaireMf, setBeneficiaireMf] = useState('')
  const [beneficiaireAddress, setBeneficiaireAddress] = useState('')
  const [beneficiaireRib, setBeneficiaireRib] = useState('')
  const [beneficiaireCin, setBeneficiaireCin] = useState('')
  const [beneficiaireCodeTva, setBeneficiaireCodeTva] = useState('')
  const [beneficiaireCodeCat, setBeneficiaireCodeCat] = useState('')
  const [beneficiaireNEtab, setBeneficiaireNEtab] = useState('')
  const [montantBrut, setMontantBrut] = useState('')
  const [taux, setTaux] = useState('1.5')
  const [natureRevenu, setNatureRevenu] = useState('Honoraires et commissions')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const montantRetenue = (Number(montantBrut) || 0) * (Number(taux) || 0) / 100

  const handleSave = async () => {
    if (!retenuerName || !beneficiaireName || !montantBrut) {
      toast('Payeur, bénéficiaire et montant sont obligatoires', 'error')
      return
    }
    setSaving(true)
    const res = await fetch('/app/api/retenues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        retenuer_name: retenuerName,
        retenuer_mf: retenuerMf || null,
        retenuer_address: retenuerAddress || null,
        retenuer_rc: retenuerRc || null,
        retenuer_rep: retenuerRep || null,
        retenuer_code_tva: retenuerCodeTva || null,
        retenuer_code_cat: retenuerCodeCat || null,
        retenuer_n_etab: retenuerNEtab || null,
        beneficiaire_name: beneficiaireName,
        beneficiaire_mf: beneficiaireMf || null,
        beneficiaire_address: beneficiaireAddress || null,
        beneficiaire_rib: beneficiaireRib || null,
        beneficiaire_cin: beneficiaireCin || null,
        beneficiaire_code_tva: beneficiaireCodeTva || null,
        beneficiaire_code_cat: beneficiaireCodeCat || null,
        beneficiaire_n_etab: beneficiaireNEtab || null,
        montantBrut: Number(montantBrut),
        tauxRetenue: Number(taux),
        natureRevenu,
        notes,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast('Retenue créée avec succès')
      router.push('/retenues')
      router.refresh()
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur lors de la création', 'error')
    }
  }

  const section = (title: string) => (
    <h3 className="text-sm font-semibold text-text pt-1">{title}</h3>
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Nouvelle retenue à la source</h1>
          <p className="text-sm text-text-muted">Attestation de retenue à la source (Art. 52 du Code de l&apos;IRPP et de l&apos;IS)</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Nature du revenu" value={natureRevenu} onChange={(e) => setNatureRevenu(e.target.value)} />
        </div>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-3">
        {section('Section A — Payeur (celui qui retient)')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Nom *" value={retenuerName} onChange={(e) => setRetenuerName(e.target.value)} />
          <Input label="MF" value={retenuerMf} onChange={(e) => setRetenuerMf(e.target.value)} />
          <Input label="RC" value={retenuerRc} onChange={(e) => setRetenuerRc(e.target.value)} />
          <Input label="Adresse" value={retenuerAddress} onChange={(e) => setRetenuerAddress(e.target.value)} />
          <Input label="Représentant" value={retenuerRep} onChange={(e) => setRetenuerRep(e.target.value)} />
          <Input label="Code TVA" value={retenuerCodeTva} onChange={(e) => setRetenuerCodeTva(e.target.value)} />
          <Input label="Code catégorie" value={retenuerCodeCat} onChange={(e) => setRetenuerCodeCat(e.target.value)} />
          <Input label="N° établissement" value={retenuerNEtab} onChange={(e) => setRetenuerNEtab(e.target.value)} />
        </div>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-3">
        {section('Section B — Bénéficiaire (celui qui reçoit)')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Nom *" value={beneficiaireName} onChange={(e) => setBeneficiaireName(e.target.value)} />
          <Input label="MF" value={beneficiaireMf} onChange={(e) => setBeneficiaireMf(e.target.value)} />
          <Input label="CIN" value={beneficiaireCin} onChange={(e) => setBeneficiaireCin(e.target.value)} />
          <Input label="Adresse" value={beneficiaireAddress} onChange={(e) => setBeneficiaireAddress(e.target.value)} />
          <Input label="RIB" value={beneficiaireRib} onChange={(e) => setBeneficiaireRib(e.target.value)} />
          <Input label="Code TVA" value={beneficiaireCodeTva} onChange={(e) => setBeneficiaireCodeTva(e.target.value)} />
          <Input label="Code catégorie" value={beneficiaireCodeCat} onChange={(e) => setBeneficiaireCodeCat(e.target.value)} />
          <Input label="N° établissement" value={beneficiaireNEtab} onChange={(e) => setBeneficiaireNEtab(e.target.value)} />
        </div>
      </div>

      <div className="bg-white border border-border-color rounded-xl p-5 space-y-3">
        {section('Section C — Montants')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Montant brut *" type="number" min={0} step="any" value={montantBrut} onChange={(e) => setMontantBrut(e.target.value)} />
          <Select label="Taux de retenue" value={taux} onChange={(e) => setTaux(e.target.value)}>
            {RETENUE_RATES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <div>
            <span className="block text-xs font-medium text-text-secondary mb-1">Montant retenu</span>
            <div className="px-3 py-2 bg-white border border-border-color rounded-lg text-sm font-semibold text-text">
              {montantRetenue.toFixed(3)} TND
            </div>
          </div>
        </div>
        <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  )
}
