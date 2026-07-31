import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <AuthCard>
      <div className="text-center py-2">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-danger-bg flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-danger" />
        </div>
        <h2 className="text-lg font-semibold text-text mb-1">Lien invalide ou expiré</h2>
        <p className="text-sm text-text-muted mb-6">
          Le lien de confirmation n&apos;est plus valide. Veuillez réessayer de vous connecter ou de
          vous inscrire.
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
