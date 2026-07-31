'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main className="flex-1 p-5 lg:p-7">{children}</main>
      </div>
    </div>
  )
}
