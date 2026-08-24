import { Inbox } from "lucide-react"

import { cn } from "@/lib/cn"


export function EmptyState({title, description, action, icon:Icon=Inbox, className}) {
  return (
    <section className={cn("w-full max-w-xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm", className)}>
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}
