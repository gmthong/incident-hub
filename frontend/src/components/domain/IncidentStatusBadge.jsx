import { Badge } from "@/components/ui/Badge"


const statuses = {
  INVESTIGATING:{label:"Investigating", variant:"amber"},
  OPEN:{label:"Open", variant:"blue"},
  RESOLVED:{label:"Resolved", variant:"emerald"},
}


export function IncidentStatusBadge({status}) {
  const selected = statuses[status] ?? {label:status || "Unknown", variant:"slate"}
  return <Badge variant={selected.variant}>{selected.label}</Badge>
}
