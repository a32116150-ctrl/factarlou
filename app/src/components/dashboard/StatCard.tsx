'use client'

import type { ReactNode } from 'react'

export interface StatCardProps {
  title: string
  value: string | number
  suffix?: string
  icon: ReactNode
  color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'teal'
}

const colorMap: Record<StatCardProps['color'], string> = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  orange: 'bg-amber-100 text-amber-600',
  teal: 'bg-teal-100 text-teal-600',
}

export function StatCard({ title, value, suffix, icon, color }: StatCardProps) {
  return (
    <div className="bg-white border border-border-color rounded-[14px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary-light opacity-0 hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text-secondary truncate">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-text tracking-tight truncate">
            {value}
            {suffix && <span className="text-sm font-medium text-text-muted ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
