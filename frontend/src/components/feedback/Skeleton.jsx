import { cn } from "@/lib/cn"


export function Skeleton({className}) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-slate-200", className)}
    />
  )
}
