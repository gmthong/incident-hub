import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { renderWithProviders } from "@/test/test-utils"


test("closes with Escape and restores focus to its trigger", async () => {
  const user = userEvent.setup()
  renderWithProviders(
    <Dialog
      description="Review the incident before continuing."
      title="Review incident"
      trigger={<Button>Open review</Button>}
    >
      <p>Incident details</p>
    </Dialog>,
  )

  const trigger = screen.getByRole("button", {name:"Open review"})
  await user.click(trigger)
  expect(screen.getByRole("dialog", {name:"Review incident"})).toBeInTheDocument()

  await user.keyboard("{Escape}")
  expect(screen.queryByRole("dialog", {name:"Review incident"})).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
