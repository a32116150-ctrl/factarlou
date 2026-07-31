'use client'

import Link from 'next/link'
import type { Document } from '@/types'
import { Badge, getPaymentStatusColor, getDocTypeColor } from '@/components/ui/Badge'
import { formatDate, formatCurrency, DOC_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/formatters'

export function RecentDocuments({ docs }: { docs: Document[] }) {
  return (
    <div className="bg-white border border-border-color rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <h3 className="text-sm font-semibold text-text">Documents récents</h3>
        <Link href="/invoices" className="text-xs text-primary hover:text-primary-dark">
          Tout voir
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase">N°</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-text-muted uppercase">Type</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-text-muted uppercase">Client</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-text-muted uppercase">Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase">Montant TTC</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  Aucun document. Créez votre première facture !
                </td>
              </tr>
            )}
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-primary">{doc.number}</td>
                <td className="px-3 py-2.5">
                  <Badge color={getDocTypeColor(doc.type)}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Badge>
                </td>
                <td className="px-3 py-2.5 text-text-secondary">{doc.client_name}</td>
                <td className="px-3 py-2.5 text-text-muted">{formatDate(doc.date)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-text">
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
