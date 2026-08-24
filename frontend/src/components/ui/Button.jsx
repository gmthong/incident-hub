import { forwardRef } from "react"

import { Spinner } from "@/components/feedback/Spinner"
import { cn } from "@/lib/cn"


const variants = {
  destructive:"bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost:"text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  outline:"border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
  primary:"bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  secondary:"bg-slate-900 text-white shadow-sm hover:bg-slate-800",
}

const sizes = {
  icon:"size-10 p-0",
  lg:"h-11 px-5",
  md:"h-10 px-4",
  sm:"h-9 px-3 text-xs",
}


export const Button = forwardRef(function Button(
  {
    children,
    className,
    disabled=false,
    isLoading=false,
    loadingLabel="Working",
    size="md",
    type="button",
    variant="primary",
    ...props
  },
  ref,
) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      )}
      disabled={disabled || isLoading}
      ref={ref}
      type={type}
      {...props}
    >
      {isLoading ? <Spinner label={loadingLabel} /> : null}
      {children}
    </button>
  )
})
