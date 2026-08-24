import { Navigate, Outlet, useLocation } from "react-router"

import { FullPageSessionLoader } from "@/features/auth/SessionLoader"
import { useAuth } from "@/features/auth/auth-context"


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
