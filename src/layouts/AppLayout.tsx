import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar/Sidebar'
import './AppLayout.css'

export function AppLayout({ children }: { children: ReactNode }) {
  return <div><Sidebar /><main className="app-main">{children}</main></div>
}
