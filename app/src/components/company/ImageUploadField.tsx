'use client'

import { useRef } from 'react'
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ImageUploadFieldProps {
  label: string
  imageUrl?: string | null
  showOnDocs: boolean
  onImageChange: (file: File) => void
  onImageRemove: () => void
  onToggleShowOnDocs: (checked: boolean) => void
}

export function ImageUploadField({
  label,
  imageUrl,
  showOnDocs,
  onImageChange,
  onImageRemove,
  onToggleShowOnDocs,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClickSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {imageUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            ✓ Importé
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageChange(file)
        }}
        className="hidden"
      />

      {imageUrl ? (
        <div className="space-y-3">
          <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-center min-h-[90px]">
            <img
              src={imageUrl}
              alt={label}
              className="max-h-20 max-w-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClickSelect}
              className="flex-1 text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Changer
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onImageRemove}
              className="text-xs"
              title="Supprimer l'image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClickSelect}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-white/60 dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
        >
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Sélectionner un {label.toLowerCase()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              PNG, JPG, SVG jusqu&apos;à 5Mo
            </p>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2.5 pt-1 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showOnDocs}
          onChange={(e) => onToggleShowOnDocs(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
        />
        <span>Afficher sur les documents PDF</span>
      </label>
    </div>
  )
}
