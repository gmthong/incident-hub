import { ArrowRight, UserRoundCheck, UserRoundX } from "lucide-react"
import { Link } from "react-router"

import { CategoryChip } from "@/components/domain/CategoryChip"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { IncidentStatusBadge } from "@/components/domain/IncidentStatusBadge"
import { userReference } from "@/utils/incidents"


export function IncidentCard({incident, currentUserUid}) {
  const isAssigned = Boolean(incident.assigned_user_uid)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="break-words font-semibold text-slate-950 hover:text-blue-700" to={`/incidents/${incident.uid}`}>
            {incident.title}
          </Link>
          <p className="mt-1 break-words text-sm text-slate-600">{incident.affected_service} · {incident.environment}</p>
          {incident.reporter_uid === currentUserUid ? (
            <p className="mt-1 text-xs font-medium text-indigo-700">Reported by you</p>
          ) : null}
        </div>
        <IncidentStatusBadge status={incident.status} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Occurred</dt>
          <dd className="mt-1 text-slate-700"><DateTimeDisplay value={incident.occurred_at} /></dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Assignment</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-slate-700">
            {isAssigned
              ? <UserRoundCheck aria-hidden="true" className="size-4 text-violet-600" />
              : <UserRoundX aria-hidden="true" className="size-4 text-slate-400" />}
            {userReference(incident.assigned_user_uid, currentUserUid, "Assigned user")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {incident.categories?.length
          ? incident.categories.map((category) => <CategoryChip key={category.uid} name={category.name} />)
          : <span className="text-xs text-slate-500">No categories</span>}
      </div>

      <Link className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800" to={`/incidents/${incident.uid}`}>
        View incident <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  )
}
