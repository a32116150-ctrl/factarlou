'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Expense } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { todayISO, formatDate, formatNumber } from '@/lib/formatters'

interface ExpenseForm {
  date: string
  vendor: string
  category: string
  description: string
  amountHT: string
  tvaRate: string
  amountTTC: string
  retenueSource: string
  paymentMethod: string
  reference: string
  docType: string
  notes: string
}

const emptyForm: ExpenseForm = {
  date: todayISO(),
  vendor: '',
  category: '',
  description: '',
  amountHT: '0',
  tvaRate: '19',
  amountTTC: '0',
  retenueSource: '0',
  paymentMethod: 'especes',
  reference: '',
  docType: 'facture',
  notes: '',
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/app/api/expenses?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setExpenses(json.data || [])
    }
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const updateTTC = (patch: Partial<ExpenseForm>) => {
    const next = { ...form, ...patch }
    const ht = Number(next.amountHT || 0)
    const tva = Number(next.tvaRate || 0)
    const ret = Number(next.retenueSource || 0)
    next.amountTTC = String((ht * (1 + tva / 100) - ht * (ret / 100)).toFixed(3))
    setForm(next)
  }

  const handleSave = async () => {
    if (!form.amountHT || Number(form.amountHT) <= 0) {
      toast('Montant HT obligatoire', 'error')
      return
    }
    setSaving(true)
    const res = await fetch('/app/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amountHT: Number(form.amountHT),
        tvaRate: Number(form.tvaRate),
        amountTTC: Number(form.amountTTC),
        retenueSource: Number(form.retenueSource),
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast('Dépense ajoutée')
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/app/api/expenses/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Dépense supprimée')
      setDeleteTarget(null)
      load()
    } else {
      toast('Erreur', 'error')
    }
  }

  const totalTTC = expenses.reduce((s, e) => s + Number(e.amount_ttc || 0), 0)
  const totalHT = expenses.reduce((s, e) => s + Number(e.amount_ht || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dépenses</h1>
          <p className="text-sm text-text-muted">
            {expenses.length} dépense(s) · HT {formatNumber(totalHT)} · TTC {formatNumber(totalTTC)}
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setModalOpen(true) }}>
          <Plus className="h-4 w-4" /> Nouvelle dépense
        </Button>
      </div>

      <div className="flex gap-2 items-end">
        <Input label="Du" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Au" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>Réinitialiser</Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-border-color rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Fournisseur</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Catégorie</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">HT</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">TTC</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">Aucune dépense trouvée.</td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-text-muted">{formatDate(e.date)}</td>
                    <td className="px-3 py-3 font-medium text-text">{e.vendor || '—'}</td>
                    <td className="px-3 py-3 text-text-muted">{e.category || '—'}</td>
                    <td className="px-3 py-3 text-right text-text-secondary">{formatNumber(e.amount_ht)}</td>
                    <td className="px-3 py-3 text-right font-medium text-text">{formatNumber(e.amount_ttc)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle dépense"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Fournisseur" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Select label="Type de document" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
              <option value="facture">Facture</option>
              <option value="ticket">Ticket</option>
              <option value="note">Note d&apos;honoraires</option>
              <option value="autre">Autre</option>
            </Select>
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Montant HT" type="number" min={0} step="any" value={form.amountHT} onChange={(e) => updateTTC({ amountHT: e.target.value })} />
            <Select label="TVA" value={form.tvaRate} onChange={(e) => updateTTC({ tvaRate: e.target.value })}>
              <option value="19">19%</option>
              <option value="13">13%</option>
              <option value="7">7%</option>
              <option value="0">0%</option>
            </Select>
            <Select label="Retenue source" value={form.retenueSource} onChange={(e) => updateTTC({ retenueSource: e.target.value })}>
              <option value="0">0%</option>
              <option value="1.5">1.5%</option>
              <option value="3">3%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-xs font-medium text-text-secondary mb-1">Montant TTC</span>
              <div className="px-3 py-2 bg-white border border-border-color rounded-lg text-sm font-semibold text-text">
                {form.amountTTC} TND
              </div>
            </div>
            <Select label="Mode de paiement" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="carte">Carte</option>
            </Select>
          </div>
          <Input label="Référence" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la dépense"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Supprimer la dépense du <strong className="text-text">{deleteTarget ? formatDate(deleteTarget.date) : ''}</strong> ?
        </p>
      </Modal>
    </div>
  )
}
