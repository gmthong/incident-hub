import { cn } from "@/lib/cn"


export function Card({children, className, ...props}) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-surface)]", className)} {...props}>{children}</section>
}

export function CardHeader({children, className}) {
  return <div className={cn("border-b border-slate-100 px-5 py-4", className)}>{children}</div>
}

export function CardTitle({children, className}) {
  return <h2 className={cn("text-base font-semibold tracking-tight text-slate-950", className)}>{children}</h2>
}

export function CardDescription({children, className}) {
  return <p className={cn("mt-1 text-sm leading-6 text-slate-600", className)}>{children}</p>
}

export function CardContent({children, className}) {
  return <div className={cn("p-5", className)}>{children}</div>
}

export function CardFooter({children, className}) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4", className)}>{children}</div>
}
