import { useState } from "react"
import { Activity, LayoutDashboard, ListTree, LogOut, ShieldCheck } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router"
import { toast } from "sonner"

import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/auth/AuthContext"
import { cn } from "@/utils/cn"


const navigation = [
  {label:"Dashboard", to:"/dashboard", icon:LayoutDashboard},
  {label:"Incidents", to:"/incidents", icon:Activity},
  {label:"Categories", to:"/categories", icon:ListTree},
]


export function AppLayout() {
  const {logout} = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success("You have been signed out")
    } catch {
      toast.info("You have been signed out locally")
    } finally {
      navigate("/login", {replace:true})
    }
  }

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
          <div className="flex items-center gap-2">
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
            <Button
              aria-label="Sign out"
              className="px-2.5"
              isLoading={isLoggingOut}
              loadingLabel="Signing out"
              onClick={handleLogout}
              variant="ghost"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </div>
        </PageContainer>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
