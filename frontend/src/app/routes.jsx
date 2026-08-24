import { Route, Routes } from "react-router"

import { HomeRoute, ProtectedRoute, PublicOnlyRoute, RoleRoute } from "@/auth/AuthGuards"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { USER_ROLES } from "@/config/constants"
import { ForbiddenPage } from "@/pages/ForbiddenPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { VerificationPendingPage } from "@/pages/auth/VerificationPendingPage"
import { VerifyAccountPage } from "@/pages/auth/VerifyAccountPage"


export function AppRoutes() {
  return (
    <Routes>
      <Route element={<HomeRoute />} path="/" />

      <Route element={<AuthLayout />}>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />
        </Route>
        <Route element={<VerificationPendingPage />} path="/verification-pending" />
        <Route element={<VerifyAccountPage />} path="/verify-account/:token" />
        <Route element={<ForgotPasswordPage />} path="/forgot-password" />
        <Route element={<ResetPasswordPage />} path="/reset-password/:token" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PlaceholderPage title="Dashboard" description="Operational incident counts, recent activity, and shortcuts." />} path="/dashboard" />
          <Route element={<PlaceholderPage title="Incidents" description="Search, filter, and review production incidents." />} path="/incidents" />
          <Route element={<PlaceholderPage title="My reported incidents" description="Incidents reported by the current user." />} path="/incidents/reported" />
          <Route element={<PlaceholderPage title="Report incident" description="Capture a new production incident." />} path="/incidents/new" />
          <Route element={<PlaceholderPage title="Incident detail" description="Incident status, classification, assignment, and analysis workspace." />} path="/incidents/:incidentUid" />
          <Route element={<PlaceholderPage title="Edit incident" description="Update incident information and resolution state." />} path="/incidents/:incidentUid/edit" />
          <Route element={<PlaceholderPage title="Categories" description="Browse incident classifications and manage them when authorized." />} path="/categories" />
          <Route element={<PlaceholderPage title="Profile" description="Review the current account and role." />} path="/profile" />
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
            <Route element={<PlaceholderPage area="Administration" title="Users" description="Manage user profile fields and roles." />} path="/admin/users" />
            <Route element={<PlaceholderPage area="Administration" title="Analyses" description="Review analyses across all incidents." />} path="/admin/analyses" />
          </Route>
          <Route element={<ForbiddenPage />} path="/forbidden" />
        </Route>
      </Route>

      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
