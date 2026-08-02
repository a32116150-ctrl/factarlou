'use client'

import { Palette, Type, LayoutTemplate, FileText, Check } from 'lucide-react'
import type { DocumentDesign } from '@/types'
import { Input } from '@/components/ui/Input'

interface DocumentThemeEditorProps {
  design: DocumentDesign
  onChange: (updated: DocumentDesign) => void
}

const COLOR_PALETTES = [
  { hex: '#4f46e5', label: 'Indigo Impérial' },
  { hex: '#0284c7', label: 'Bleu Océan' },
  { hex: '#059669', label: 'Émeraude Pro' },
  { hex: '#d97706', label: 'Ambre Chaud' },
  { hex: '#dc2626', label: 'Rouge Écarlate' },
  { hex: '#1e293b', label: 'Ardoise Sombre' },
]

export function DocumentThemeEditor({ design, onChange }: DocumentThemeEditorProps) {
  const update = (partial: Partial<DocumentDesign>) => {
    onChange({ ...design, ...partial })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Controls Column */}
      <div className="lg:col-span-7 space-y-6 bg-white border border-border-color rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-light">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Personnalisation Visuelle des PDF</h3>
            <p className="text-xs text-text-muted">Ajustez les couleurs, typographies et éléments graphiques de vos factures</p>
          </div>
        </div>

        {/* Primary Color Picker */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-text">
            Couleur Principale du Document
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {COLOR_PALETTES.map((c) => {
              const isSelected = design.primaryColor.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ primaryColor: c.hex })}
                  className={`w-9 h-9 rounded-full transition-transform relative cursor-pointer ${
                    isSelected ? 'scale-110 ring-2 ring-offset-2 ring-indigo-600 shadow-md' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {isSelected && <Check className="h-4 w-4 text-white absolute inset-0 m-auto stroke-[3]" />}
                </button>
              )
            })}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <input
                type="color"
                value={design.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                title="Couleur personnalisée"
              />
              <span className="text-xs font-mono text-text-muted">{design.primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
            <Type className="h-4 w-4 text-indigo-600" />
            Police du document
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'inter', label: 'Inter / Arial', sample: 'Aa Bb' },
              { id: 'roboto', label: 'Roboto', sample: 'Aa Bb' },
              { id: 'playfair', label: 'Georgia / Serif', sample: 'Aa Bb' },
              { id: 'mono', label: 'Monospace', sample: 'Aa Bb' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => update({ fontFamily: f.id as any })}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  design.fontFamily === f.id
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-text hover:border-slate-300'
                }`}
              >
                <div className="text-xs">{f.label}</div>
                <div className="text-sm opacity-70 mt-1 font-semibold">{f.sample}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Layout Style */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
            <LayoutTemplate className="h-4 w-4 text-indigo-600" />
            Style de l&apos;en-tête (Template)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'classic', label: 'Classique', desc: 'Ligne d\'accentuation' },
              { id: 'modern', label: 'Moderne', desc: 'Bandeau supérieur' },
              { id: 'minimalist', label: 'Minimaliste', desc: 'Épuré & minimal' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ templateStyle: t.id as any })}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  design.templateStyle === t.id
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-text hover:border-slate-300'
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Footer & Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <Input
            label="Mention de bas de page (Pied de page)"
            value={design.customFooterText}
            onChange={(e) => update({ customFooterText: e.target.value })}
            placeholder="Mention légale ou message de remerciement..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-medium text-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={design.showBankDetails}
                onChange={(e) => update({ showBankDetails: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
              />
              Afficher le RIB/IBAN sur le document
            </label>
            <label className="flex items-center gap-2.5 text-xs font-medium text-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={design.showSignatureBox}
                onChange={(e) => update({ showSignatureBox: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
              />
              Afficher la zone signature & cachet
            </label>
          </div>
        </div>
      </div>

      {/* Live Interactive Preview Card Column */}
      <div className="lg:col-span-5 sticky top-4">
        <div className="bg-slate-200 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-indigo-600" /> Aperçu en direct du document</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase font-bold">PDF A4</span>
          </div>

          <div className="bg-white text-slate-900 rounded-lg p-4 shadow-md text-[10px] leading-tight space-y-3 min-h-[380px] border border-slate-300">
            {/* Header Mockup */}
            <div className="flex justify-between items-start border-b pb-2" style={{ borderColor: design.primaryColor }}>
              <div>
                <div className="font-extrabold text-sm" style={{ color: design.primaryColor }}>MON ENTREPRISE SARL</div>
                <div className="text-[9px] text-slate-500">MF: 1234567/A/M/000</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xs uppercase" style={{ color: design.primaryColor }}>FACTURE</div>
                <div className="text-[9px] text-slate-500">N° FAC-2026-0001</div>
              </div>
            </div>

            {/* Client Mockup */}
            <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Facturé à</span>
                <div className="font-bold text-slate-800 text-[10px]">Client Exemple S.A.</div>
              </div>
              <div className="text-right text-[9px] text-slate-500">
                <div>Date: 01/08/2026</div>
                <div>Échéance: 31/08/2026</div>
              </div>
            </div>

            {/* Table Mockup */}
            <table className="w-full text-[9px]">
              <thead>
                <tr className="text-white" style={{ backgroundColor: design.primaryColor }}>
                  <th className="p-1 text-left">Description</th>
                  <th className="p-1 text-right">Qté</th>
                  <th className="p-1 text-right">Prix HT</th>
                  <th className="p-1 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-1 font-medium">Prestation Conseil IT</td>
                  <td className="p-1 text-right">1</td>
                  <td className="p-1 text-right">1 200,000</td>
                  <td className="p-1 text-right font-bold">1 200,000</td>
                </tr>
              </tbody>
            </table>

            {/* Totals Mockup */}
            <div className="flex justify-end pt-2">
              <div className="w-1/2 space-y-1 text-right text-[9px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total HT:</span>
                  <span className="font-semibold">1 200,000 TND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TVA (19%):</span>
                  <span className="font-semibold">228,000 TND</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t" style={{ color: design.primaryColor }}>
                  <span>Total TTC:</span>
                  <span>1 428,000 TND</span>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            {design.customFooterText && (
              <div className="text-[8px] text-slate-400 text-center pt-2 border-t border-slate-100">
                {design.customFooterText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
