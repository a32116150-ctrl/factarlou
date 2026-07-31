'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id, children, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full px-3 py-2 bg-white border border-border-color rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
