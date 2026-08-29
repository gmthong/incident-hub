import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { IconButton } from "@/components/ui/IconButton"
import { cn } from "@/utils/cn"


export function Dialog({
  children,
  className,
  contentClassName,
  description,
  footer,
  onOpenChange,
  open,
  title,
  trigger,
}) {
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
            className,
          )}
        >
          <div className="border-b border-slate-100 px-5 py-4 pr-14">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-slate-950">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className={description ? "mt-1 text-sm leading-6 text-slate-600" : "sr-only"}>
              {description ?? "Dialog window"}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton className="absolute right-3 top-3 size-8" label="Close dialog" variant="ghost">
              <X aria-hidden="true" className="size-4" />
            </IconButton>
          </DialogPrimitive.Close>
          <div className={cn("min-h-0 flex-1 overflow-y-auto p-5", contentClassName)}>{children}</div>
          {footer ? <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogClose({children, ...props}) {
  return <DialogPrimitive.Close {...props}>{children}</DialogPrimitive.Close>
}
