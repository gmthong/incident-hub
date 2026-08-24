import { Tag } from "lucide-react"

import { cn } from "@/lib/cn"


export function CategoryChip({name, className}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm", className)}>
      <Tag aria-hidden="true" className="size-3" />
      {name}
    </span>
  )
}
