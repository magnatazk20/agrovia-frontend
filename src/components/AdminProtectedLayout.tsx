import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import RequireMaxAdmin from './RequireMaxAdmin'
import AdminSidebar from './AdminSidebar'
import AppBottomNav from './AppBottomNav'
import './AppSidebar.css'

interface AdminProtectedLayoutProps {
  children?: ReactNode
}

export default function AdminProtectedLayout({ children }: AdminProtectedLayoutProps) {
  return (
    <RequireMaxAdmin>
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-content">
          <Outlet />
          {children}
          <AppBottomNav />
        </main>
      </div>
    </RequireMaxAdmin>
  )
}
