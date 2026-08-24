import { Navigate, Route, Routes } from "react-router"

import { AppLayout } from "@/components/layout/AppLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { AuthPlaceholderPage } from "@/pages/AuthPlaceholderPage"
import { ForbiddenPage } from "@/pages/ForbiddenPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"


export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />

      <Route element={<AuthLayout />}>
        <Route element={<AuthPlaceholderPage title="Sign in" description="Use your IncidentHub credentials to continue." />} path="/login" />
        <Route element={<AuthPlaceholderPage title="Create account" description="Register a new engineer account." />} path="/register" />
        <Route element={<AuthPlaceholderPage title="Check your email" description="Verify your account before opening protected pages." />} path="/verification-pending" />
        <Route element={<AuthPlaceholderPage title="Verify account" description="The verification token will be processed here." />} path="/verify-account/:token" />
        <Route element={<AuthPlaceholderPage title="Forgot password" description="Request a secure password-reset link." />} path="/forgot-password" />
        <Route element={<AuthPlaceholderPage title="Reset password" description="Choose and confirm a new password." />} path="/reset-password/:token" />
      </Route>

      <Route element={<AppLayout />}>
        <Route element={<PlaceholderPage title="Dashboard" description="Operational incident counts, recent activity, and shortcuts." />} path="/dashboard" />
        <Route element={<PlaceholderPage title="Incidents" description="Search, filter, and review production incidents." />} path="/incidents" />
        <Route element={<PlaceholderPage title="My reported incidents" description="Incidents reported by the current user." />} path="/incidents/reported" />
        <Route element={<PlaceholderPage title="Report incident" description="Capture a new production incident." />} path="/incidents/new" />
        <Route element={<PlaceholderPage title="Incident detail" description="Incident status, classification, assignment, and analysis workspace." />} path="/incidents/:incidentUid" />
        <Route element={<PlaceholderPage title="Edit incident" description="Update incident information and resolution state." />} path="/incidents/:incidentUid/edit" />
        <Route element={<PlaceholderPage title="Categories" description="Browse incident classifications and manage them when authorized." />} path="/categories" />
        <Route element={<PlaceholderPage title="Profile" description="Review the current account and role." />} path="/profile" />
        <Route element={<PlaceholderPage area="Administration" title="Users" description="Manage user profile fields and roles." />} path="/admin/users" />
        <Route element={<PlaceholderPage area="Administration" title="Analyses" description="Review analyses across all incidents." />} path="/admin/analyses" />
        <Route element={<ForbiddenPage />} path="/forbidden" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  )
}
