import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { MailCheck } from 'lucide-react'

export default function ConfirmEmailPage() {
  return (
    <AuthCard>
      <div className="text-center py-2">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-success-bg flex items-center justify-center">
          <MailCheck className="h-7 w-7 text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text mb-1">Vérifiez votre email</h2>
        <p className="text-sm text-text-muted mb-6">
          Un lien de confirmation a été envoyé à votre adresse. Cliquez dessus pour activer votre
          compte, puis connectez-vous.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    </AuthCard>
  )
}
