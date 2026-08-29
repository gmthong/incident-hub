import { cn } from "@/utils/cn"


export function PageContainer({children, className, ...props}) {
  return (
    <div className={cn("mx-auto min-w-0 w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8", className)} {...props}>
      {children}
    </div>
  )
}
