'use client'

import type { ReactNode } from 'react'

export interface StatCardProps {
  title: string
  value: string | number
  suffix?: string
  icon: ReactNode
  color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'teal'
}

const colorMap: Record<StatCardProps['color'], { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400' },
}

export function StatCard({ title, value, suffix, icon, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-100">
            {value}
            {suffix && <span className="text-sm font-medium text-slate-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg} ${c.text}`}>{icon}</div>
      </div>
    </div>
  )
}
