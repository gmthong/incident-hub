import { Route, Routes } from "react-router"

import { HomeRoute, ProtectedRoute, PublicOnlyRoute, RoleRoute } from "@/auth/AuthGuards"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { USER_ROLES } from "@/config/constants"
import { DashboardPage } from "@/pages/DashboardPage"
import { ForbiddenPage } from "@/pages/ForbiddenPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { VerificationPendingPage } from "@/pages/auth/VerificationPendingPage"
import { VerifyAccountPage } from "@/pages/auth/VerifyAccountPage"
import { IncidentCreatePage } from "@/pages/incidents/IncidentCreatePage"
import { IncidentDetailPage } from "@/pages/incidents/IncidentDetailPage"
import { IncidentEditPage } from "@/pages/incidents/IncidentEditPage"
import { AllIncidentsPage, ReportedIncidentsPage } from "@/pages/incidents/IncidentListPage"


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
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<AllIncidentsPage />} path="/incidents" />
          <Route element={<ReportedIncidentsPage />} path="/incidents/reported" />
          <Route element={<IncidentCreatePage />} path="/incidents/new" />
          <Route element={<IncidentDetailPage />} path="/incidents/:incidentUid" />
          <Route element={<IncidentEditPage />} path="/incidents/:incidentUid/edit" />
          <Route element={<PlaceholderPage title="Categories" description="Browse incident classifications and manage them when authorized." />} path="/categories" />
          <Route element={<ProfilePage />} path="/profile" />
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
