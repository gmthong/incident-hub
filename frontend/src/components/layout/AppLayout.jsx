import { useState } from "react"
import {
  Activity,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { UserRoleBadge } from "@/components/domain/UserRoleBadge"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu"
import { USER_ROLES } from "@/config/constants"
import { cn } from "@/utils/cn"


const primaryNavigation = [
  {label:"Dashboard", to:"/dashboard", icon:LayoutDashboard, end:true},
  {label:"Incidents", to:"/incidents", icon:Activity, end:true},
  {label:"My reported incidents", to:"/incidents/reported", icon:ClipboardList, end:true},
  {label:"Categories", to:"/categories", icon:ListTree, end:true},
  {label:"Profile", to:"/profile", icon:UserRound, end:true},
]

const adminNavigation = [
  {label:"Users", to:"/admin/users", icon:Users, end:true},
  {label:"Analyses", to:"/admin/analyses", icon:FileText, end:true},
]


function getPageTitle(pathname) {
  const exactTitles = {
    "/admin/analyses":"Analyses",
    "/admin/users":"Users",
    "/categories":"Categories",
    "/dashboard":"Dashboard",
    "/incidents":"Incidents",
    "/incidents/new":"Report incident",
    "/incidents/reported":"My reported incidents",
    "/profile":"Profile",
  }

  if (exactTitles[pathname]) {
    return exactTitles[pathname]
  }
  if (pathname.startsWith("/incidents/") && pathname.endsWith("/edit")) {
    return "Edit incident"
  }
  if (pathname.startsWith("/incidents/")) {
    return "Incident details"
  }
  if (pathname === "/forbidden") {
    return "Access denied"
  }

  return "Page not found"
}


function userInitials(user) {
  const names = [user?.first_name, user?.last_name].filter(Boolean)
  if (names.length > 0) {
    return names.map((name) => name[0]).join("").slice(0, 2).toUpperCase()
  }

  return (user?.username || user?.email || "IH").slice(0, 2).toUpperCase()
}


function Brand({onNavigate}) {
  return (
    <NavLink className="flex items-center gap-3" onClick={onNavigate} to="/dashboard">
      <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/25">
        <ShieldCheck aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="font-semibold tracking-tight text-white">IncidentHub</p>
        <p className="text-xs text-slate-400">Operations workspace</p>
      </div>
    </NavLink>
  )
}


function NavigationLink({item, onNavigate}) {
  const Icon = item.icon

  return (
    <NavLink
      className={({isActive}) => cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
      end={item.end}
      onClick={onNavigate}
      to={item.to}
    >
      <Icon aria-hidden="true" className="size-4.5" />
      {item.label}
    </NavLink>
  )
}


function NavigationPanel({isLoggingOut, onLogout, onNavigate, user}) {
  const isAdmin = user?.role === USER_ROLES.ADMIN

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Primary navigation" className="space-y-1">
        {primaryNavigation.map((item) => (
          <NavigationLink item={item} key={item.to} onNavigate={onNavigate} />
        ))}
      </nav>

      {isAdmin ? (
        <div className="mt-7">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Administration</p>
          <nav aria-label="Administration navigation" className="mt-2 space-y-1">
            {adminNavigation.map((item) => (
              <NavigationLink item={item} key={item.to} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      ) : null}

      <div className="mt-auto border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-sm font-semibold text-white">
            {userInitials(user)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.username || "IncidentHub user"}</p>
            <p className="truncate text-xs text-slate-400">{user?.email || "Email unavailable"}</p>
          </div>
        </div>
        <Button
          className="mt-3 w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          isLoading={isLoggingOut}
          loadingLabel="Signing out"
          onClick={onLogout}
          variant="ghost"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}


export function AppLayout({children}) {
  const {logout, user} = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const pageTitle = getPageTitle(location.pathname)

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    try {
      await logout()
      toast.success("You have been signed out")
    } catch {
      toast.info("You have been signed out locally")
    } finally {
      setIsMobileNavigationOpen(false)
      navigate("/login", {replace:true})
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen flex-col bg-slate-950 px-4 py-5 lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mt-8 flex min-h-0 flex-1">
          <NavigationPanel
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
            <Dialog
              className="left-0 top-0 h-screen w-[min(20rem,calc(100%-2rem))] max-w-none translate-x-0 translate-y-0 rounded-l-none rounded-r-xl border-y-0 border-l-0"
              contentClassName="flex h-[calc(100vh-4.6rem)] max-h-none flex-col bg-slate-950 p-4"
              description="Navigate between IncidentHub pages."
              onOpenChange={setIsMobileNavigationOpen}
              open={isMobileNavigationOpen}
              title="Navigation"
              trigger={(
                <Button className="lg:hidden" size="icon" variant="outline">
                  <Menu aria-hidden="true" className="size-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              )}
            >
              <div className="mb-6"><Brand onNavigate={() => setIsMobileNavigationOpen(false)} /></div>
              <NavigationPanel
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
                onNavigate={() => setIsMobileNavigationOpen(false)}
                user={user}
              />
            </Dialog>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight text-slate-950">{pageTitle}</p>
            </div>

            <NavLink
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 md:px-4"
              to="/incidents/new"
            >
              <FilePlus2 aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Report incident</span>
              <span className="sr-only md:hidden">Report incident</span>
            </NavLink>

            <DropdownMenu
              label="Open user menu"
              trigger={(
                <Button className="max-w-56 gap-2 px-2" variant="ghost">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                    {userInitials(user)}
                  </span>
                  <span className="hidden min-w-0 text-left md:block">
                    <span className="block truncate text-xs font-medium text-slate-900">{user?.email || "Account"}</span>
                    <span className="mt-0.5 block"><UserRoleBadge role={user?.role} /></span>
                  </span>
                  <ChevronDown aria-hidden="true" className="hidden size-4 text-slate-500 md:block" />
                </Button>
              )}
            >
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <UserRound aria-hidden="true" className="size-4" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isLoggingOut} onSelect={handleLogout}>
                <LogOut aria-hidden="true" className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
