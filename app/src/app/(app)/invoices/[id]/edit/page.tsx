import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !doc) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Chargement du document...</div>}>
      <InvoiceForm initialData={doc} />
    </Suspense>
  )
}
