'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Service } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { formatNumber } from '@/lib/formatters'

interface ServiceForm {
  name: string
  description: string
  price: string
  tva: string
  category: string
  unit: string
  barcode: string
  stock: string
  minStock: string
}

const emptyForm: ServiceForm = {
  name: '', description: '', price: '0', tva: '19', category: '', unit: 'unité', barcode: '', stock: '0', minStock: '0',
}

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const res = await fetch(`/app/api/services?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setServices(json.data || [])
    }
    setLoading(false)
  }, [q])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      description: s.description || '',
      price: String(s.price || 0),
      tva: String(s.tva || 0),
      category: s.category || '',
      unit: s.unit || 'unité',
      barcode: s.barcode || '',
      stock: String(s.stock || 0),
      minStock: String(s.min_stock || 0),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Le nom est obligatoire', 'error')
      return
    }
    setSaving(true)
    const url = editingId ? `/app/api/services/${editingId}` : '/app/api/services'
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: Number(form.price || 0),
        tva: Number(form.tva || 0),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast(editingId ? 'Produit modifié' : 'Produit créé')
      setModalOpen(false)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/app/api/services/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Produit supprimé')
      setDeleteTarget(null)
      load()
    } else {
      toast('Erreur', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Produits / Services</h1>
          <p className="text-sm text-text-muted">{services.length} produit(s)</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Nouveau produit</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input placeholder="Rechercher un produit..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
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
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Catégorie</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">Prix HT</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">TVA</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-text-muted uppercase">Unité</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-text-muted uppercase">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {services.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">Aucun produit trouvé.</td>
                  </tr>
                )}
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{s.name}</td>
                    <td className="px-3 py-3 text-text-muted">{s.category || '—'}</td>
                    <td className="px-3 py-3 text-right text-text-secondary">{formatNumber(s.price)}</td>
                    <td className="px-3 py-3 text-text-secondary">{s.tva}%</td>
                    <td className="px-3 py-3 text-text-muted">{s.unit}</td>
                    <td className={`px-3 py-3 text-right ${s.stock <= s.min_stock ? 'text-red-600 font-medium' : 'text-text-secondary'}`}>
                      {s.stock}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-primary cursor-pointer">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-danger cursor-pointer">
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
        title={editingId ? 'Modifier le produit' : 'Nouveau produit'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix HT" type="number" min={0} step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Select label="TVA" value={form.tva} onChange={(e) => setForm({ ...form, tva: e.target.value })}>
              <option value="19">19%</option>
              <option value="13">13%</option>
              <option value="7">7%</option>
              <option value="0">0%</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code-barres" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <Input label="Stock minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le produit"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Supprimer <strong className="text-text">{deleteTarget?.name}</strong> ?
        </p>
      </Modal>
    </div>
  )
}
