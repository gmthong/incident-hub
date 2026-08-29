import { useState } from "react"

import { Button } from "@/components/ui/Button"
import { Dialog, DialogClose } from "@/components/ui/Dialog"


export function ConfirmDialog({
  cancelLabel="Cancel",
  confirmLabel="Confirm",
  description,
  isPending=false,
  onConfirm,
  title,
  trigger,
  variant="destructive",
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [open, setOpen] = useState(false)
  const pending = isPending || isConfirming

  async function handleConfirm() {
    setIsConfirming(true)
    try {
      await onConfirm?.()
      setOpen(false)
    } catch {
      // The caller owns the visible error; keep the confirmation open for retry.
    } finally {
      setIsConfirming(false)
    }
  }

  function changeOpen(nextOpen) {
    if (!pending) {
      setOpen(nextOpen)
    }
  }

  return (
    <Dialog
      description={description}
      footer={(
        <>
          <DialogClose asChild>
            <Button disabled={pending} variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <Button isLoading={pending} loadingLabel={confirmLabel} onClick={handleConfirm} variant={variant}>{confirmLabel}</Button>
        </>
      )}
      onOpenChange={changeOpen}
      open={open}
      title={title}
      trigger={trigger}
    >
      <p className="text-sm leading-6 text-slate-700">This action takes effect immediately after confirmation.</p>
    </Dialog>
  )
}
