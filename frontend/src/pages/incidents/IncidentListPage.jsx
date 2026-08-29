import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { FilePlus2, SearchX, Siren } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { IncidentCard } from "@/components/incidents/IncidentCard"
import { IncidentFilters } from "@/components/incidents/IncidentFilters"
import { IncidentTable } from "@/components/incidents/IncidentTable"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/ui/PageHeader"
import { apiRequest } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import {
  DEFAULT_INCIDENT_FILTERS,
  filterAndSortIncidents,
  getIncidentFilterOptions,
  getIncidentFilters,
  hasActiveIncidentFilters,
} from "@/utils/incidents"


const filterParameters = {
  category:"category",
  environment:"environment",
  relationship:"relationship",
  search:"q",
  sort:"sort",
  status:"status",
}


function IncidentListSkeleton({reportedOnly}) {
  return (
    <PageContainer aria-busy="true" aria-live="polite" role="status">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-7 h-36" />
      <Skeleton className="mt-6 h-80" />
      <span className="sr-only">Loading {reportedOnly ? "reported incidents" : "incidents"}</span>
    </PageContainer>
  )
}


export function IncidentListPage({reportedOnly=false}) {
  const {user} = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const incidentsQuery = useQuery({
    enabled:!reportedOnly || Boolean(user?.uid),
    queryFn:({signal}) => apiRequest(
      reportedOnly ? `incidents/users/${user.uid}` : "incidents/",
      {signal},
    ),
    queryKey:reportedOnly ? queryKeys.incidents.reportedBy(user?.uid) : queryKeys.incidents.all,
  })
  const filters = getIncidentFilters(searchParams)
  const incidents = useMemo(
    () => Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [],
    [incidentsQuery.data],
  )
  const options = useMemo(() => getIncidentFilterOptions(incidents), [incidents])
  const visibleIncidents = useMemo(
    () => filterAndSortIncidents(incidents, filters, user?.uid),
    [filters, incidents, user?.uid],
  )
  const hasFilters = hasActiveIncidentFilters(filters)

  function changeFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    const parameter = filterParameters[name]
    if (value === DEFAULT_INCIDENT_FILTERS[name]) {
      next.delete(parameter)
    } else {
      next.set(parameter, value)
    }
    setSearchParams(next, {replace:true})
  }

  function clearFilters() {
    setSearchParams({}, {replace:true})
  }

  if (incidentsQuery.isPending) {
    return <IncidentListSkeleton reportedOnly={reportedOnly} />
  }

  const title = reportedOnly ? "My reported incidents" : "Incidents"
  const description = reportedOnly
    ? "Review incidents you reported. Assigned incidents are available from the main incident list."
    : "Search, filter, and review operational incidents across IncidentHub."

  if (incidentsQuery.isError) {
    return (
      <PageContainer>
        <PageHeader eyebrow="Operations" title={title} description={description} />
        <ErrorState
          className="mt-8 max-w-none"
          description="IncidentHub could not retrieve this incident list. Check the backend connection and try again."
          onRetry={incidentsQuery.refetch}
          title="Could not load incidents"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        actions={(
          <Link className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700" to="/incidents/new">
            <FilePlus2 aria-hidden="true" className="size-4" />
            Report incident
          </Link>
        )}
        description={description}
        eyebrow="Operations"
        title={title}
      />

      {incidents.length === 0 ? (
        <EmptyState
          action={(
            <Link className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700" to="/incidents/new">
              <FilePlus2 aria-hidden="true" className="size-4" />
              Report incident
            </Link>
          )}
          className="mt-8 max-w-none"
          description={reportedOnly
            ? "You have not reported any incidents yet."
            : "There are no incidents in IncidentHub yet."}
          icon={Siren}
          title={reportedOnly ? "No reported incidents" : "No incidents reported"}
        />
      ) : (
        <>
          <IncidentFilters
            categories={options.categories}
            environments={options.environments}
            filters={filters}
            hasActiveFilters={hasFilters}
            onChange={changeFilter}
            onClear={clearFilters}
          />

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{visibleIncidents.length}</span> of {incidents.length} incidents
            </p>
          </div>

          {visibleIncidents.length === 0 ? (
            <EmptyState
              action={(
                <button className="text-sm font-medium text-blue-700 hover:text-blue-800" onClick={clearFilters} type="button">
                  Clear all filters
                </button>
              )}
              className="mt-5 max-w-none"
              description="No incidents match the current search and filter combination."
              icon={SearchX}
              title="No matching incidents"
            />
          ) : (
            <>
              <div className="mt-5 hidden lg:block">
                <IncidentTable currentUserUid={user.uid} incidents={visibleIncidents} />
              </div>
              <div className="mt-5 grid gap-4 lg:hidden">
                {visibleIncidents.map((incident) => (
                  <IncidentCard currentUserUid={user.uid} incident={incident} key={incident.uid} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  )
}


export function AllIncidentsPage() {
  return <IncidentListPage />
}


export function ReportedIncidentsPage() {
  return <IncidentListPage reportedOnly />
}
