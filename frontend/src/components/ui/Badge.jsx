import { cn } from "@/lib/cn"


const variants = {
  amber:"border-amber-200 bg-amber-50 text-amber-800",
  blue:"border-blue-200 bg-blue-50 text-blue-800",
  emerald:"border-emerald-200 bg-emerald-50 text-emerald-800",
  indigo:"border-indigo-200 bg-indigo-50 text-indigo-800",
  orange:"border-orange-200 bg-orange-50 text-orange-800",
  red:"border-red-200 bg-red-50 text-red-800",
  slate:"border-slate-200 bg-slate-100 text-slate-700",
  violet:"border-violet-200 bg-violet-50 text-violet-800",
}


export function Badge({children, className, variant="slate"}) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none", variants[variant] ?? variants.slate, className)}>
      {children}
    </span>
  )
}
