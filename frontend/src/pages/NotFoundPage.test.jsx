import { screen } from "@testing-library/react"

import { AppRoutes } from "@/app/router"
import { renderWithProviders } from "@/test/test-utils"


test("renders the not-found page for an unknown route", () => {
  renderWithProviders(<AppRoutes />, {route:"/unknown-route"})

  expect(screen.getByRole("heading", {name:"Page not found"})).toBeInTheDocument()
  expect(screen.getByRole("link", {name:"Return to IncidentHub"})).toBeInTheDocument()
})
