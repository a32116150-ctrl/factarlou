'use client'

import { useState } from 'react'
import { Check, Palette, Type, LayoutTemplate, FileText } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export interface DocumentDesignSettings {
  primaryColor: string
  fontFamily: 'inter' | 'roboto' | 'playfair' | 'mono'
  templateStyle: 'classic' | 'modern' | 'minimalist'
  customFooterText: string
  showBankDetails: boolean
  showTaxBreakdown: boolean
  showSignatureBox: boolean
}

export const DEFAULT_DOCUMENT_DESIGN: DocumentDesignSettings = {
  primaryColor: '#1e3a8a',
  fontFamily: 'inter',
  templateStyle: 'classic',
  customFooterText: 'Document édité avec Factarlou. Merci de votre confiance.',
  showBankDetails: true,
  showTaxBreakdown: true,
  showSignatureBox: true,
}

export const COLOR_PRESETS = [
  { hex: '#1e3a8a', label: 'Bleu Marine' },
  { hex: '#059669', label: 'Vert Émeraude' },
  { hex: '#4f46e5', label: 'Indigo Moderne' },
  { hex: '#18181b', label: 'Noir Charcoal' },
  { hex: '#dc2626', label: 'Rouge Carmin' },
  { hex: '#d97706', label: 'Ambre Foncif' },
  { hex: '#7c3aed', label: 'Violet Royal' },
]

interface DocumentThemeEditorProps {
  value: DocumentDesignSettings
  onChange: (updated: DocumentDesignSettings) => void
}

export function DocumentThemeEditor({ value, onChange }: DocumentThemeEditorProps) {
  const design = { ...DEFAULT_DOCUMENT_DESIGN, ...value }

  const update = (patch: Partial<DocumentDesignSettings>) => {
    onChange({ ...design, ...patch })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Settings Form Column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Color Palette */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
            <Palette className="h-4 w-4 text-indigo-600" />
            Couleur d&apos;accentuation du PDF
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {COLOR_PRESETS.map((c) => {
              const isSelected = design.primaryColor.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ primaryColor: c.hex })}
                  className={`relative w-9 h-9 rounded-full transition-transform cursor-pointer border-2 ${
                    isSelected ? 'scale-110 border-slate-900 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {isSelected && <Check className="h-4 w-4 text-white absolute inset-0 m-auto stroke-[3]" />}
                </button>
              )
            })}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <input
                type="color"
                value={design.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
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
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text hover:border-slate-300'
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
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text hover:border-slate-300'
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Footer & Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
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
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-indigo-600" /> Aperçu en direct du document</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase font-bold">PDF A4</span>
          </div>

          <div className="bg-white text-slate-900 rounded-lg p-4 shadow-md text-[10px] leading-tight space-y-3 min-h-[380px] border border-slate-300">
            {/* Header Mockup */}
            {design.templateStyle === 'modern' ? (
              <div
                className="p-3 rounded-lg text-white mb-2"
                style={{ backgroundColor: design.primaryColor }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs">MON ENTREPRISE</span>
                  <span className="font-bold text-[9px] bg-white/20 px-2 py-0.5 rounded">FACTURE N° FAC-2026-0001</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start border-b pb-2" style={{ borderColor: design.primaryColor }}>
                <div>
                  <div className="font-black text-xs text-slate-900">MON ENTREPRISE</div>
                  <div className="text-[9px] text-slate-500">Matricule Fiscal : 1234567/A/M/000</div>
                </div>
                <div className="text-right">
                  <div
                    className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white mb-1"
                    style={{ backgroundColor: design.primaryColor }}
                  >
                    FACTURE
                  </div>
                  <div className="font-bold text-slate-900 text-xs">N° FAC-2026-0001</div>
                </div>
              </div>
            )}

            {/* Client info preview */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[9px]">
              <div>
                <div className="font-bold uppercase text-slate-400 text-[8px]">Émetteur</div>
                <div className="font-semibold text-slate-800">Mon Entreprise SARL</div>
              </div>
              <div>
                <div className="font-bold uppercase text-[8px]" style={{ color: design.primaryColor }}>Client</div>
                <div className="font-semibold text-slate-800">Client Démo SARL</div>
              </div>
            </div>

            {/* Mockup Line items table */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="text-white font-bold" style={{ backgroundColor: design.primaryColor }}>
                    <th className="p-1 text-left">Désignation</th>
                    <th className="p-1 text-center">Qté</th>
                    <th className="p-1 text-right">Prix HT</th>
                    <th className="p-1 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-1 font-medium">Service de consulting informatique</td>
                    <td className="p-1 text-center">1</td>
                    <td className="p-1 text-right">1 500,000</td>
                    <td className="p-1 text-right font-bold">1 500,000</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1 font-medium">Développement Web & Mobile</td>
                    <td className="p-1 text-center">2</td>
                    <td className="p-1 text-right">800,000</td>
                    <td className="p-1 text-right font-bold">1 600,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals mockup */}
            <div className="flex justify-end pt-1">
              <div className="w-1/2 space-y-0.5 text-[9px] text-right">
                <div className="flex justify-between"><span className="text-slate-500">Total HT :</span> <span>3 100,000 TND</span></div>
                <div className="flex justify-between"><span className="text-slate-500">TVA (19%) :</span> <span>589,000 TND</span></div>
                <div className="flex justify-between font-black text-[10px] pt-1 border-t border-slate-300" style={{ color: design.primaryColor }}>
                  <span>Total TTC :</span>
                  <span>3 689,000 TND</span>
                </div>
              </div>
            </div>

            {/* Signature & Bank info mockup */}
            {design.showSignatureBox && (
              <div className="flex justify-between items-center border-t pt-2 text-[8px] text-slate-500">
                <span>Signature & Cachet</span>
                <span className="border-b border-dashed border-slate-400 w-20 h-4 inline-block"></span>
              </div>
            )}

            {/* Footer preview */}
            <div className="text-[8px] text-slate-400 text-center pt-2 border-t border-slate-200 italic">
              {design.customFooterText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
