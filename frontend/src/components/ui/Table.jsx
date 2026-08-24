import { cn } from "@/lib/cn"


export function Table({children, className, ...props}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-surface)]">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props}>{children}</table>
    </div>
  )
}

export function TableHeader({children, className}) {
  return <thead className={cn("border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500", className)}>{children}</thead>
}

export function TableBody({children, className}) {
  return <tbody className={cn("divide-y divide-slate-100", className)}>{children}</tbody>
}

export function TableRow({children, className, ...props}) {
  return <tr className={cn("transition-colors hover:bg-slate-50", className)} {...props}>{children}</tr>
}

export function TableHead({children, className, ...props}) {
  return <th className={cn("px-4 py-3 font-semibold", className)} scope="col" {...props}>{children}</th>
}

export function TableCell({children, className, ...props}) {
  return <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props}>{children}</td>
}
