import { screen } from "@testing-library/react"

import { AnalysisSeverityBadge } from "@/components/domain/AnalysisSeverityBadge"
import { IncidentStatusBadge } from "@/components/domain/IncidentStatusBadge"
import { UserRoleBadge } from "@/components/domain/UserRoleBadge"
import { renderWithProviders } from "@/test/test-utils"


test("renders readable labels for status, severity, and role values", () => {
  renderWithProviders(
    <>
      <IncidentStatusBadge status="INVESTIGATING" />
      <AnalysisSeverityBadge severity="CRITICAL" />
      <UserRoleBadge role="admin" />
    </>,
  )

  expect(screen.getByText("Investigating")).toBeInTheDocument()
  expect(screen.getByText("Critical")).toBeInTheDocument()
  expect(screen.getByText("Admin")).toBeInTheDocument()
})
