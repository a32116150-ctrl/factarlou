'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Client, Document } from '@/types'
import { LineItems, type LineItemDraft } from './LineItems'
import { TotalsPanel } from './TotalsPanel'
import { ClientSelector } from './ClientSelector'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { todayISO } from '@/lib/formatters'
import { DOC_TYPE_LABELS } from '@/lib/formatters'

const DOC_TYPES = ['facture', 'devis', 'bon', 'avoir', 'bl', 'ba', 'bs', 'be', 'ticket', 'proforma', 'forfaitaire']
const PAYMENT_MODES = ['Espèces', 'Virement bancaire', 'Chèque', 'Carte bancaire', 'Traite']
const CURRENCIES = ['TND', 'EUR', 'USD']

const TIMBRE_TYPES = ['facture', 'bon']

interface InvoiceFormProps {
  initialData?: Document
}

export default function InvoiceForm({ initialData }: InvoiceFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const isEdit = Boolean(initialData?.id)

  const [type, setType] = useState(initialData?.type || searchParams.get('type') || 'facture')
  const [date, setDate] = useState(initialData?.date || todayISO())
  const [client, setClient] = useState<Client | null>(
    initialData
      ? {
          id: initialData.client_id || '',
          user_id: initialData.user_id || '',
          name: initialData.client_name || '',
          mf: initialData.client_mf || undefined,
          address: initialData.client_address || undefined,
          phone: initialData.client_phone || undefined,
          email: initialData.client_email || undefined,
          category: 'standard',
          credit_limit: 0,
        }
      : null
  )

  let parsedItems: LineItemDraft[] = []
  if (initialData?.items_json) {
    try {
      parsedItems = typeof initialData.items_json === 'string'
        ? JSON.parse(initialData.items_json)
        : (initialData.items_json as any)
    } catch {}
  }

  const [items, setItems] = useState<LineItemDraft[]>(
    parsedItems.length > 0
      ? parsedItems
      : [{ description: '', quantity: 1, price: 0, tva: 19, unit: 'unité' }]
  )
  const [applyTimbre, setApplyTimbre] = useState(initialData?.apply_timbre ?? false)
  const [discountPercent, setDiscountPercent] = useState(initialData?.discount_percent || 0)
  const [discountAmount, setDiscountAmount] = useState(initialData?.discount_amount || 0)
  const [currency, setCurrency] = useState(initialData?.currency || 'TND')
  const [paymentMode, setPaymentMode] = useState(initialData?.payment_mode || 'Virement bancaire')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [internalNotes, setInternalNotes] = useState(initialData?.internal_notes || '')
  const [saving, setSaving] = useState(false)

  const isForfaitaire = type === 'forfaitaire'
  const canTimbre = TIMBRE_TYPES.includes(type)

  const handleTypeChange = (t: string) => {
    setType(t)
    if (t === 'forfaitaire') {
      setApplyTimbre(false)
      setItems((prev) => prev.map((it) => ({ ...it, tva: 0 })))
    }
  }

  const handleDiscountPercent = (v: number) => {
    setDiscountPercent(v)
    if (v > 0) setDiscountAmount(0)
  }

  const handleDiscountAmount = (v: number) => {
    setDiscountAmount(v)
    if (v > 0) setDiscountPercent(0)
  }

  const handleSave = async () => {
    const validItems = items.filter((it) => it.description.trim() && it.quantity > 0)
    if (validItems.length === 0) {
      toast('Ajoutez au moins une ligne avec description et quantité', 'error')
      return
    }
    if (!client) {
      toast('Sélectionnez un client', 'error')
      return
    }
    if (discountPercent > 0 && discountAmount > 0) {
      toast('Remise: choisissez % OU montant, pas les deux', 'error')
      return
    }

    setSaving(true)
    const url = isEdit ? `/app/api/documents/${initialData.id}` : '/app/api/documents'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        date,
        clientId: client.id,
        clientName: client.name,
        clientMF: client.mf || null,
        clientAddress: client.address || null,
        clientPhone: client.phone || null,
        clientEmail: client.email || null,
        items: validItems,
        applyTimbre: canTimbre && applyTimbre,
        discountPercent,
        discountAmount,
        currency,
        paymentMode,
        notes,
        internalNotes,
      }),
    })
    setSaving(false)

    if (res.ok) {
      toast(isEdit ? 'Document modifié avec succès' : 'Document créé avec succès')
      router.push('/invoices')
      router.refresh()
    } else {
      const json = await res.json().catch(() => ({}))
      toast(json.error || 'Erreur lors de l\'enregistrement', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Nouveau document</h1>
          <p className="text-sm text-text-muted">Créez une facture, un devis, un bon de commande...</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Enregistrer le document</Button>
      </div>

      {isForfaitaire && (
        <div className="bg-warning-bg border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning">
          Régime Forfaitaire — TVA non applicable. Le timbre fiscal est désactivé.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border-color rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Type de document" value={type} onChange={(e) => handleTypeChange(e.target.value)}>
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>
                ))}
              </Select>
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            <div>
              <span className="block text-xs font-medium text-text-secondary mb-1">Client</span>
              <ClientSelector value={client} onChange={setClient} />
            </div>

            <LineItems items={items} forfaitaire={isForfaitaire} onChange={setItems} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-light">
              <div>
                <span className="block text-xs font-medium text-text-secondary mb-1">Remise (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={discountPercent || ''}
                  onChange={(e) => handleDiscountPercent(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-text-secondary mb-1">Remise (montant)</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={discountAmount || ''}
                  onChange={(e) => handleDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {canTimbre && !isForfaitaire && (
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer pt-2 border-t border-border-light">
                <input
                  type="checkbox"
                  checked={applyTimbre}
                  onChange={(e) => setApplyTimbre(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Appliquer le Droit de Timbre (0.600 TND)
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Mode de paiement" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="bg-white border border-border-color rounded-xl p-4 space-y-3">
            <Textarea label="Notes (visibles sur le document)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Textarea label="Notes internes (non visibles)" rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <TotalsPanel
            items={items}
            applyTimbre={canTimbre && applyTimbre}
            discountPercent={discountPercent}
            discountAmount={discountAmount}
            decimalPlaces={3}
            roundingMethod="half_up"
            currency={currency}
            forfaitaire={isForfaitaire}
          />
          <div className="bg-white border border-border-color rounded-xl p-4">
            <h3 className="text-xs font-medium text-text-muted uppercase mb-2">Récapitulatif</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Type</dt>
                <dd className="text-text">{DOC_TYPE_LABELS[type] || type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Date</dt>
                <dd className="text-text">{date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Client</dt>
                <dd className="text-text">{client ? client.name : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Lignes</dt>
                <dd className="text-text">{items.filter((i) => i.description).length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
