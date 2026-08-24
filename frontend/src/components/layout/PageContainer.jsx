import { cn } from "@/utils/cn"


export function PageContainer({children, className}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8", className)}>
      {children}
    </div>
  )
}
