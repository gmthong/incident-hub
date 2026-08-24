import { forwardRef } from "react"

import { cn } from "@/lib/cn"


export const Textarea = forwardRef(function Textarea({className, rows=5, ...props}, ref) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100",
        className,
      )}
      ref={ref}
      rows={rows}
      {...props}
    />
  )
})
