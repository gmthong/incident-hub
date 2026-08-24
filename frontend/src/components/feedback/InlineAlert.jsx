import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/cn"


const variants = {
  error:{classes:"border-red-200 bg-red-50 text-red-900", icon:CircleAlert},
  info:{classes:"border-blue-200 bg-blue-50 text-blue-900", icon:Info},
  success:{classes:"border-emerald-200 bg-emerald-50 text-emerald-900", icon:CircleCheck},
  warning:{classes:"border-amber-200 bg-amber-50 text-amber-950", icon:TriangleAlert},
}


export function InlineAlert({title, children, variant="info", className}) {
  const selected = variants[variant] ?? variants.info
  const Icon = selected.icon

  return (
    <div className={cn("flex gap-3 rounded-lg border p-4 text-sm", selected.classes, className)} role={variant === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn("leading-6", title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  )
}
