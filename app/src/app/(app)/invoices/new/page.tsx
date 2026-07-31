import { Suspense } from 'react'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Chargement...</div>}>
      <InvoiceForm />
    </Suspense>
  )
}
