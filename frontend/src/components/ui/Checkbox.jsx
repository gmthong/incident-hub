import { forwardRef } from "react"

import { cn } from "@/lib/cn"


export const Checkbox = forwardRef(function Checkbox({className, ...props}, ref) {
  return (
    <input
      className={cn(
        "size-4 rounded border-slate-300 text-blue-600 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      ref={ref}
      type="checkbox"
      {...props}
    />
  )
})
