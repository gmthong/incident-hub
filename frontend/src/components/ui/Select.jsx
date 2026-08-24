import { forwardRef } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/utils/cn"


export const Select = forwardRef(function Select({children, className, ...props}, ref) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-950 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
})
