import { Badge } from "@/components/ui/Badge"


const roles = {
  admin:{label:"Admin", variant:"violet"},
  engineer:{label:"Engineer", variant:"blue"},
  leader:{label:"Leader", variant:"indigo"},
}


export function UserRoleBadge({role}) {
  const selected = roles[role] ?? {label:role || "Unknown", variant:"slate"}
  return <Badge variant={selected.variant}>{selected.label}</Badge>
}
