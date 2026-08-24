import { screen } from "@testing-library/react"

import { AppRoutes } from "@/app/router"
import { renderWithProviders } from "@/test/test-utils"


test("renders the application root route", () => {
  renderWithProviders(<AppRoutes />, {route:"/login"})

  expect(screen.getByRole("heading", {name:"Sign in"})).toBeInTheDocument()
  expect(screen.getByText("IncidentHub")).toBeInTheDocument()
})


test("renders a nested dynamic incident route inside the application layout", () => {
  renderWithProviders(
    <AppRoutes />,
    {route:"/incidents/11111111-1111-4111-8111-111111111111"},
  )

  expect(screen.getByRole("heading", {name:"Incident detail"})).toBeInTheDocument()
  expect(screen.getByRole("navigation", {name:"Primary navigation"})).toBeInTheDocument()
})
