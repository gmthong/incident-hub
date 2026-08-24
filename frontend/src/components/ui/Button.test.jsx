import { screen } from "@testing-library/react"

import { Button } from "@/components/ui/Button"
import { renderWithProviders } from "@/test/test-utils"


test("disables the button and displays progress while loading", () => {
  renderWithProviders(<Button isLoading loadingLabel="Saving incident">Save incident</Button>)

  const button = screen.getByRole("button", {name:/save incident/i})
  expect(button).toBeDisabled()
  expect(screen.getByRole("status", {name:"Saving incident"})).toBeInTheDocument()
})
