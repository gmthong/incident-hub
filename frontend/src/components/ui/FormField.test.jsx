import { screen } from "@testing-library/react"

import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { renderWithProviders } from "@/test/test-utils"


test("associates its label, description, and error with the input", () => {
  renderWithProviders(
    <FormField
      description="Use a concise operational title."
      error="Title is required"
      id="incident-title"
      label="Title"
      required
    >
      <Input />
    </FormField>,
  )

  const input = screen.getByLabelText(/title/i)
  expect(input).toHaveAttribute("aria-invalid", "true")
  expect(input).toHaveAccessibleDescription("Use a concise operational title. Title is required")
  expect(screen.getByRole("alert")).toHaveTextContent("Title is required")
})
