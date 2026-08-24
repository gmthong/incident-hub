import { forwardRef } from "react"

import { cn } from "@/utils/cn"


export const Input = forwardRef(function Input({className, type="text", ...props}, ref) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
})
