import { cn } from "@/lib/cn"


export function PageHeader({title, description, eyebrow, actions, className}) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p> : null}
        <h1 className={cn("text-2xl font-semibold tracking-tight text-slate-950", eyebrow && "mt-2")}>{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
