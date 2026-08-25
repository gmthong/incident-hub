import { UserRoundCheck, UserRoundX } from "lucide-react"
import { Link } from "react-router"

import { CategoryChip } from "@/components/domain/CategoryChip"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { IncidentStatusBadge } from "@/components/domain/IncidentStatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { userReference } from "@/utils/incidents"


export function IncidentTable({incidents, currentUserUid}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Incident</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Occurred</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead>Assignment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((incident) => (
          <TableRow key={incident.uid}>
            <TableCell>
              <Link className="font-medium text-slate-950 hover:text-blue-700" to={`/incidents/${incident.uid}`}>
                {incident.title}
              </Link>
              <p className="mt-1 text-xs text-slate-500">{incident.affected_service} · {incident.environment}</p>
              {incident.reporter_uid === currentUserUid ? (
                <p className="mt-1 text-xs font-medium text-indigo-700">Reported by you</p>
              ) : null}
            </TableCell>
            <TableCell><IncidentStatusBadge status={incident.status} /></TableCell>
            <TableCell className="whitespace-nowrap"><DateTimeDisplay value={incident.occurred_at} /></TableCell>
            <TableCell>
              <div className="flex max-w-64 flex-wrap gap-1.5">
                {incident.categories?.length
                  ? incident.categories.slice(0, 2).map((category) => <CategoryChip key={category.uid} name={category.name} />)
                  : <span className="text-xs text-slate-500">None</span>}
                {incident.categories?.length > 2 ? (
                  <span className="self-center text-xs text-slate-500">+{incident.categories.length - 2}</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2 whitespace-nowrap">
                {incident.assigned_user_uid
                  ? <UserRoundCheck aria-hidden="true" className="size-4 text-violet-600" />
                  : <UserRoundX aria-hidden="true" className="size-4 text-slate-400" />}
                {userReference(incident.assigned_user_uid, currentUserUid, "User")}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
