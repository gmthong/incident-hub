import { ShieldCheck } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router"

import { Spinner } from "@/components/feedback/Spinner"
import { useAuth } from "@/auth/AuthContext"


export function FullPageSessionLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Restoring your IncidentHub session</p>
          <p className="mt-1 text-sm text-slate-400">Checking your secure sign-in cookie.</p>
        </div>
        <Spinner className="size-5 text-blue-300" label="Checking session" />
      </div>
    </main>
  )
}


export function ProtectedRoute() {
  const location = useLocation()
  const {status} = useAuth()

  if (status === "checking") {
    return <FullPageSessionLoader />
  }
  if (status === "unverified") {
    return <Navigate replace to="/verification-pending" />
  }
  if (status !== "authenticated") {
    return <Navigate replace state={{from:location}} to="/login" />
  }

  return <Outlet />
}


export function PublicOnlyRoute() {
  const {status} = useAuth()

  if (status === "checking") {
    return <FullPageSessionLoader />
  }
  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}


export function RoleRoute({allowedRoles}) {
  const {user} = useAuth()
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate replace to="/forbidden" />
  }

  return <Outlet />
}


export function HomeRoute() {
  const {status} = useAuth()

  if (status === "checking") {
    return <FullPageSessionLoader />
  }

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />
  }
  if (status === "unverified") {
    return <Navigate replace to="/verification-pending" />
  }

  return <Navigate replace to="/login" />
}
