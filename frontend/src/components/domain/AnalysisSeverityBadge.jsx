import { Badge } from "@/components/ui/Badge"


const severities = {
  CRITICAL:{label:"Critical", variant:"red"},
  HIGH:{label:"High", variant:"orange"},
  LOW:{label:"Low", variant:"slate"},
  MEDIUM:{label:"Medium", variant:"amber"},
}


export function AnalysisSeverityBadge({severity}) {
  const selected = severities[severity] ?? {label:severity || "Unknown", variant:"slate"}
  return <Badge variant={selected.variant}>{selected.label}</Badge>
}
