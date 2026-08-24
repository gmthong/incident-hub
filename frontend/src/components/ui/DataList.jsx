import { cn } from "@/utils/cn"


export function DataList({items, className}) {
  return (
    <dl className={cn("divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4 shadow-[var(--shadow-surface)]", className)}>
      {items.map(({label, value}) => (
        <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4" key={label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="min-w-0 text-sm text-slate-800">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
