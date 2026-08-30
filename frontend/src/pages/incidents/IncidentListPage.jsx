import { useDeferredValue, useEffect } from "react"
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
import { Pagination } from "@/components/ui/Pagination"
import { apiRequest } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import {
  DEFAULT_INCIDENT_FILTERS,
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

const PAGE_SIZE = 50


function getPage(searchParams) {
  const requestedPage = Number(searchParams.get("page") || 1)
  return Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1
}


function getRequestParameters(filters, page) {
  const parameters = new URLSearchParams({
    page:String(page),
    page_size:String(PAGE_SIZE),
  })
  if (filters.search.trim()) parameters.set("q", filters.search.trim())
  if (filters.status) parameters.set("status", filters.status)
  if (filters.environment.trim()) parameters.set("environment", filters.environment.trim())
  if (filters.category) parameters.set("category", filters.category)
  if (filters.relationship !== DEFAULT_INCIDENT_FILTERS.relationship) {
    parameters.set("relationship", filters.relationship)
  }
  if (filters.sort !== DEFAULT_INCIDENT_FILTERS.sort) parameters.set("sort", filters.sort)
  return parameters.toString()
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
  const filters = getIncidentFilters(searchParams)
  const page = getPage(searchParams)
  const deferredSearch = useDeferredValue(filters.search)
  const requestParameters = getRequestParameters({...filters, search:deferredSearch}, page)
  const incidentsQuery = useQuery({
    enabled:!reportedOnly || Boolean(user?.uid),
    queryFn:({signal}) => apiRequest(
      `${reportedOnly ? `incidents/users/${user.uid}` : "incidents/"}?${requestParameters}`,
      {signal},
    ),
    queryKey:reportedOnly
      ? queryKeys.incidents.reportedBy(user?.uid, requestParameters)
      : queryKeys.incidents.list(requestParameters),
  })
  const categoriesQuery = useQuery({
    queryFn:({signal}) => apiRequest("categories/", {signal}),
    queryKey:queryKeys.categories.all,
  })
  const pagination = incidentsQuery.data || {items:[], page, page_size:PAGE_SIZE, total:0, total_pages:0}
  const incidents = Array.isArray(pagination.items) ? pagination.items : []
  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []
  const hasFilters = hasActiveIncidentFilters(filters)

  useEffect(() => {
    if (pagination.total_pages > 0 && page > pagination.total_pages) {
      const next = new URLSearchParams(searchParams)
      next.set("page", String(pagination.total_pages))
      setSearchParams(next, {replace:true})
    }
  }, [page, pagination.total_pages, searchParams, setSearchParams])

  function changeFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    const parameter = filterParameters[name]
    if (value === DEFAULT_INCIDENT_FILTERS[name]) {
      next.delete(parameter)
    } else {
      next.set(parameter, value)
    }
    next.delete("page")
    setSearchParams(next, {replace:true})
  }

  function clearFilters() {
    setSearchParams({}, {replace:true})
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams)
    if (nextPage === 1) {
      next.delete("page")
    } else {
      next.set("page", String(nextPage))
    }
    setSearchParams(next, {replace:true})
    window.scrollTo({behavior:"smooth", top:0})
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

      {pagination.total === 0 && !hasFilters ? (
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
            categories={categories}
            filters={filters}
            hasActiveFilters={hasFilters}
            onChange={changeFilter}
            onClear={clearFilters}
          />

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{incidents.length}</span> of {pagination.total} matching incidents
            </p>
          </div>

          {incidents.length === 0 ? (
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
                <IncidentTable currentUserUid={user.uid} incidents={incidents} />
              </div>
              <div className="mt-5 grid gap-4 lg:hidden">
                {incidents.map((incident) => (
                  <IncidentCard currentUserUid={user.uid} incident={incident} key={incident.uid} />
                ))}
              </div>
              <Pagination
                onPageChange={changePage}
                page={pagination.page}
                totalPages={pagination.total_pages}
              />
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
