import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu"

import { cn } from "@/lib/cn"


export function DropdownMenu({trigger, children, label="Actions"}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger aria-label={label} asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="end"
          className="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          sideOffset={6}
        >
          {children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  )
}

export function DropdownMenuItem({children, className, destructive=false, ...props}) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950",
        destructive && "text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-800",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownPrimitive.Item>
  )
}

export const DropdownMenuSeparator = ({className}) => (
  <DropdownPrimitive.Separator className={cn("my-1 h-px bg-slate-100", className)} />
)
