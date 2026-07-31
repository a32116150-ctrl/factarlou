'use client'

import Link from 'next/link'
import type { Document } from '@/types'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'

export function RecentDocuments({ docs }: { docs: Document[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100">Documents récents</h3>
        <Link href="/invoices" className="text-xs text-blue-400 hover:text-blue-300">
          Tout voir
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">N°</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase">Client</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Montant TTC</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aucun document. Créez votre première facture !
                </td>
              </tr>
            )}
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-2.5 font-medium text-blue-400">{doc.number}</td>
                <td className="px-3 py-2.5">
                  <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
                </td>
                <td className="px-3 py-2.5 text-slate-300">{doc.client_name}</td>
                <td className="px-3 py-2.5 text-slate-400">{formatDate(doc.date)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                  {formatCurrency(doc.total_ttc, doc.currency)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge color={getPaymentStatusColor(doc.payment_status)}>
                    {PAYMENT_STATUS_LABELS[doc.payment_status] || doc.payment_status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
