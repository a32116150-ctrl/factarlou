'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Client } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

interface ClientForm {
  name: string
  mf: string
  email: string
  phone: string
  address: string
  rib: string
  category: string
  creditLimit: string
  notes: string
}

const emptyForm: ClientForm = {
  name: '',
  mf: '',
  email: '',
  phone: '',
  address: '',
  rib: '',
  category: 'standard',
  creditLimit: '0',
  notes: '',
}

export default function ClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    const res = await fetch(`/app/api/clients?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setClients(json.data || [])
    }
    setLoading(false)
  }, [q, category])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      mf: c.mf || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      rib: c.rib || '',
      category: c.category || 'standard',
      creditLimit: String(c.credit_limit || 0),
      notes: c.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Le nom est obligatoire', 'error')
      return
    }
    if (form.mf) {
      const cleaned = form.mf.trim().toUpperCase()
      const valid = /^\d{7}\/[A-Z]\/[A-Z]\/\d{3}$/.test(cleaned) || /^\d{7}[A-Z][A-Z]\d{3}$/.test(cleaned)
      if (!valid) {
        toast('Matricule Fiscal invalide', 'error')
        return
      }
    }
    setSaving(true)
    const url = editingId ? `/app/api/clients/${editingId}` : '/app/api/clients'
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        creditLimit: Number(form.creditLimit || 0),
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast(editingId ? 'Client modifié' : 'Client créé')
      setModalOpen(false)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/app/api/clients/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Client supprimé')
      setDeleteTarget(null)
      load()
    } else {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Clients</h1>
          <p className="text-sm text-text-muted">{clients.length} client(s)</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Ajouter un client</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input placeholder="Rechercher par nom, MF, email..." value={q} onChange={(e) => { setQ(e.target.value); setLoading(true) }} className="pl-9" />
        </div>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setLoading(true) }}>
          <option value="">Toutes les catégories</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-border-color rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Nom</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">MF</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Email</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Téléphone</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Catégorie</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">Aucun client trouvé.</td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                    <td className="px-3 py-3 text-text-muted">{c.mf || '—'}</td>
                    <td className="px-3 py-3 text-text-muted">{c.email || '—'}</td>
                    <td className="px-3 py-3 text-text-muted">{c.phone || '—'}</td>
                    <td className="px-3 py-3">
                      <Badge color={c.category === 'vip' ? 'purple' : c.category === 'premium' ? 'blue' : 'gray'}>
                        {c.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-primary cursor-pointer" title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer" title="Supprimer">
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
        title={editingId ? 'Modifier le client' : 'Nouveau client'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nom / Raison sociale *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Matricule Fiscal" placeholder="1234567/A/M/000" value={form.mf} onChange={(e) => setForm({ ...form, mf: e.target.value })} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="RIB" value={form.rib} onChange={(e) => setForm({ ...form, rib: e.target.value })} />
          </div>
          <Input label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </Select>
            <Input label="Limite de crédit (TND)" type="number" min={0} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Voulez-vous vraiment supprimer <strong className="text-text">{deleteTarget?.name}</strong> ?
        </p>
      </Modal>
    </div>
  )
}
