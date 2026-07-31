'use client'

import type { ReactNode } from 'react'

export interface CardProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, subtitle, icon, action, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-border-color rounded-xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            {icon && <span className="text-text-muted">{icon}</span>}
            <div>
              <h3 className="text-sm font-bold text-text">{title}</h3>
              {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
