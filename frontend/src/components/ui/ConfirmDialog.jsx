import { useState } from "react"

import { Button } from "@/components/ui/Button"
import { Dialog, DialogClose } from "@/components/ui/Dialog"


export function ConfirmDialog({
  cancelLabel="Cancel",
  confirmLabel="Confirm",
  description,
  onConfirm,
  title,
  trigger,
  variant="destructive",
}) {
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    onConfirm?.()
    setOpen(false)
  }

  return (
    <Dialog
      description={description}
      footer={(
        <>
          <DialogClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <Button onClick={handleConfirm} variant={variant}>{confirmLabel}</Button>
        </>
      )}
      onOpenChange={setOpen}
      open={open}
      title={title}
      trigger={trigger}
    >
      <p className="text-sm leading-6 text-slate-700">This action takes effect immediately after confirmation.</p>
    </Dialog>
  )
}
