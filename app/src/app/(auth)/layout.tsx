import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #4f46e5 50%, #0ea5e9 100%)' }}
    >
      {children}
    </div>
  )
}
