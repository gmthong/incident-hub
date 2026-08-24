import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/cn"


export function Spinner({className, label="Loading"}) {
  return (
    <LoaderCircle
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      role="status"
    />
  )
}
