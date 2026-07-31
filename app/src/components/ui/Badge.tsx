'use client'

import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'teal' | 'gray'
}

const colorClasses: Record<NonNullable<BadgeProps['color']>, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  teal: 'bg-teal-100 text-teal-800',
  gray: 'bg-gray-100 text-gray-800',
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  )
}

export function getPaymentStatusColor(status: string): BadgeProps['color'] {
  if (status === 'paid') return 'green'
  if (status === 'partial') return 'yellow'
  return 'red'
}

export function getDocTypeColor(type: string): BadgeProps['color'] {
  const map: Record<string, BadgeProps['color']> = {
    facture: 'blue',
    devis: 'yellow',
    avoir: 'orange',
    bon: 'green',
    bl: 'teal',
    forfaitaire: 'gray',
  }
  return map[type] || 'gray'
}

export function getRetenueStatusColor(status: string): BadgeProps['color'] {
  const map: Record<string, BadgeProps['color']> = {
    emis: 'blue',
    encaisse: 'green',
    annule: 'red',
  }
  return map[status] || 'gray'
}
