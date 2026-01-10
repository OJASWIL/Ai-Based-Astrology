import type { ReactNode } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { Starfield } from "./starfield"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <Starfield />
      <div className="flex relative z-10">
        {/* Sidebar - Hidden on mobile */}
        <DashboardSidebar className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:fixed lg:inset-y-0" />

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          <DashboardHeader title={title} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
