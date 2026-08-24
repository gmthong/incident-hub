import { Activity, LayoutDashboard, ListTree, ShieldCheck } from "lucide-react"
import { NavLink, Outlet } from "react-router"

import { PageContainer } from "@/components/layout/PageContainer"
import { cn } from "@/lib/cn"


const navigation = [
  {label:"Dashboard", to:"/dashboard", icon:LayoutDashboard},
  {label:"Incidents", to:"/incidents", icon:Activity},
  {label:"Categories", to:"/categories", icon:ListTree},
]


export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <PageContainer className="flex min-h-16 items-center justify-between gap-4 py-3">
          <NavLink className="flex items-center gap-2 font-semibold tracking-tight" to="/dashboard">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span>IncidentHub</span>
          </NavLink>
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center justify-end gap-1">
            {navigation.map(({label, to, icon:Icon}) => (
              <NavLink
                className={({isActive}) => cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
                key={to}
                to={to}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </PageContainer>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
