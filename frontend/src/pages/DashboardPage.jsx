import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  FolderOpen,
  Search,
  Siren,
  UserCheck,
} from "lucide-react"
import { Link } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { IncidentStatusBadge } from "@/components/domain/IncidentStatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { apiRequest } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import { getDashboardSummary } from "@/utils/dashboard"


const metricStyles = {
  amber:"bg-amber-50 text-amber-700",
  blue:"bg-blue-50 text-blue-700",
  emerald:"bg-emerald-50 text-emerald-700",
  indigo:"bg-indigo-50 text-indigo-700",
  slate:"bg-slate-100 text-slate-700",
  violet:"bg-violet-50 text-violet-700",
}

const progressStyles = {
  INVESTIGATING:"bg-amber-500",
  OPEN:"bg-blue-500",
  RESOLVED:"bg-emerald-500",
}


function MetricCard({icon:Icon, label, value, variant}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${metricStyles[variant]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}


function DashboardSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({length:6}, (_, index) => <Skeleton className="h-28" key={index} />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </PageContainer>
  )
}


export function DashboardPage() {
  const {user} = useAuth()
  const incidentsQuery = useQuery({
    queryFn:({signal}) => apiRequest("incidents/", {signal}),
    queryKey:queryKeys.incidents.all,
  })

  if (incidentsQuery.isPending) {
    return <DashboardSkeleton />
  }

  if (incidentsQuery.isError) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Operations overview"
          title="Dashboard"
          description="Review the current incident picture and recent operational activity."
        />
        <ErrorState
          className="mt-8 max-w-none"
          title="Could not load the incident dashboard"
          description="IncidentHub could not retrieve incidents from the API. Check the backend connection and try again."
          onRetry={incidentsQuery.refetch}
        />
      </PageContainer>
    )
  }

  const summary = getDashboardSummary(incidentsQuery.data, user.uid)
  const metrics = [
    {icon:Activity, label:"Total incidents", value:summary.counts.total, variant:"slate"},
    {icon:FolderOpen, label:"Open", value:summary.counts.open, variant:"blue"},
    {icon:Search, label:"Investigating", value:summary.counts.investigating, variant:"amber"},
    {icon:CheckCircle2, label:"Resolved", value:summary.counts.resolved, variant:"emerald"},
    {icon:UserCheck, label:"Assigned to me", value:summary.counts.assignedToMe, variant:"violet"},
    {icon:ClipboardCheck, label:"Reported by me", value:summary.counts.reportedByMe, variant:"indigo"},
  ]

  return (
    <PageContainer>
      <PageHeader
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50" to="/incidents">
              View incidents
            </Link>
            <Link className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700" to="/incidents/new">
              <FilePlus2 aria-hidden="true" className="size-4" />
              Report incident
            </Link>
          </div>
        )}
        eyebrow="Operations overview"
        title={`Welcome back, ${user.first_name || user.username}`}
        description="Review the current incident picture and recent operational activity."
      />

      {summary.counts.total === 0 ? (
        <EmptyState
          action={(
            <Link className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700" to="/incidents/new">
              <FilePlus2 aria-hidden="true" className="size-4" />
              Report the first incident
            </Link>
          )}
          className="mt-8 max-w-none"
          description="There are no incidents in IncidentHub yet. Start by recording the first operational event."
          icon={Siren}
          title="No incidents reported"
        />
      ) : (
        <>
          <section aria-label="Incident metrics" className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Status distribution</CardTitle>
                <p className="mt-1 text-sm text-slate-600">Current incident workload by status.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {summary.statusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="tabular-nums text-slate-600">{item.count} · {item.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        aria-hidden="true"
                        className={`h-full rounded-full ${progressStyles[item.status]}`}
                        style={{width:`${item.percentage}%`}}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent incidents</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">The latest incidents in backend order.</p>
                </div>
                <Link className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800" to="/incidents">
                  View all <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </CardHeader>
              <ul className="divide-y divide-slate-100">
                {summary.recentIncidents.map((incident) => (
                  <li key={incident.uid}>
                    <Link className="block px-5 py-4 transition-colors hover:bg-slate-50" to={`/incidents/${incident.uid}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{incident.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {incident.affected_service} · {incident.environment}
                          </p>
                        </div>
                        <IncidentStatusBadge status={incident.status} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Occurred <DateTimeDisplay value={incident.occurred_at} />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  )
}
