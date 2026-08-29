import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { AnalysisList } from "@/components/analyses/AnalysisList"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Select } from "@/components/ui/Select"
import { ANALYSIS_SEVERITIES, USER_ROLES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import { filterAnalyses } from "@/utils/analyses"


function AnalysesSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-live="polite" role="status">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-7 h-20" />
      <div className="mt-6 grid gap-4">
        {Array.from({length:3}, (_, index) => <Skeleton className="h-48" key={index} />)}
      </div>
      <span className="sr-only">Loading global analyses</span>
    </PageContainer>
  )
}


export function AdminAnalysesPage() {
  const {refreshUser, user} = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("")
  const isAdmin = user?.role === USER_ROLES.ADMIN
  const analysesQuery = useQuery({
    enabled:isAdmin,
    queryFn:({signal}) => apiRequest("analyses/", {signal}),
    queryKey:queryKeys.analyses.all,
  })
  const updateMutation = useMutation({
    mutationFn:({analysisUid, values}) => apiRequest(`analyses/${analysisUid}`, {body:values, method:"PATCH"}),
  })
  const deleteMutation = useMutation({
    mutationFn:(analysis) => apiRequest(`analyses/${analysis.uid}`, {method:"DELETE"}),
  })
  const analyses = useMemo(
    () => Array.isArray(analysesQuery.data) ? analysesQuery.data : [],
    [analysesQuery.data],
  )
  const visibleAnalyses = useMemo(
    () => filterAnalyses(analyses, {search, severity}),
    [analyses, search, severity],
  )

  useEffect(() => {
    if (analysesQuery.error?.status === 403) {
      refreshUser().catch(() => undefined)
    }
  }, [analysesQuery.error, refreshUser])

  async function updateAnalysis(analysis, values) {
    const updatedAnalysis = await updateMutation.mutateAsync({analysisUid:analysis.uid, values})
    queryClient.setQueryData(queryKeys.analyses.all, (currentAnalyses=[]) => (
      currentAnalyses.map((item) => item.uid === updatedAnalysis.uid ? updatedAnalysis : item)
    ))
    queryClient.setQueryData(queryKeys.analyses.detail(updatedAnalysis.uid), updatedAnalysis)
    await queryClient.invalidateQueries({queryKey:queryKeys.incidents.detail(updatedAnalysis.incident_uid)})
    toast.success("Analysis updated")
  }

  async function deleteAnalysis(analysis) {
    try {
      await deleteMutation.mutateAsync(analysis)
      queryClient.setQueryData(queryKeys.analyses.all, (currentAnalyses=[]) => (
        currentAnalyses.filter((item) => item.uid !== analysis.uid)
      ))
      queryClient.removeQueries({exact:true, queryKey:queryKeys.analyses.detail(analysis.uid)})
      await queryClient.invalidateQueries({queryKey:queryKeys.incidents.detail(analysis.incident_uid)})
      toast.success("Analysis deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "IncidentHub could not delete this analysis."))
      throw error
    }
  }

  function clearFilters() {
    setSearch("")
    setSeverity("")
  }

  if (analysesQuery.isPending) {
    return <AnalysesSkeleton />
  }

  if (analysesQuery.isError) {
    return (
      <PageContainer>
        <PageHeader
          description="Review analyses recorded across every incident."
          eyebrow="Administration"
          title="Analyses"
        />
        <ErrorState
          className="mt-8 max-w-none"
          description={analysesQuery.error?.status === 403
            ? "Your account no longer has permission to review global analyses. Refreshing your current role…"
            : "IncidentHub could not retrieve the global analysis list."}
          onRetry={analysesQuery.error?.status === 403 ? undefined : analysesQuery.refetch}
          title={analysesQuery.error?.status === 403 ? "Administration access changed" : "Could not load analyses"}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        description="Review, filter, and manage incident analyses across IncidentHub. Incident links safely handle records deleted after this list loads."
        eyebrow="Administration"
        title="Analyses"
      />

      <section aria-label="Analysis filters" className="mt-7 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-surface)] md:grid-cols-[minmax(0,1fr)_14rem_auto]">
        <label className="relative">
          <span className="sr-only">Search analyses</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search text or UUIDs" value={search} />
        </label>
        <label>
          <span className="sr-only">Filter by severity</span>
          <Select onChange={(event) => setSeverity(event.target.value)} value={severity}>
            <option value="">All severities</option>
            <option value={ANALYSIS_SEVERITIES.LOW}>Low</option>
            <option value={ANALYSIS_SEVERITIES.MEDIUM}>Medium</option>
            <option value={ANALYSIS_SEVERITIES.HIGH}>High</option>
            <option value={ANALYSIS_SEVERITIES.CRITICAL}>Critical</option>
          </Select>
        </label>
        <Button disabled={!search && !severity} onClick={clearFilters} variant="ghost">Clear filters</Button>
      </section>

      <p className="mt-5 text-sm text-slate-600">Showing <span className="font-semibold text-slate-900">{visibleAnalyses.length}</span> of {analyses.length} analyses</p>
      <div className="mt-5">
        <AnalysisList
          analyses={visibleAnalyses}
          currentUser={user}
          emptyAction={(search || severity) ? (
            <button className="text-sm font-medium text-blue-700 hover:text-blue-800" onClick={clearFilters} type="button">Clear filters</button>
          ) : null}
          emptyDescription={(search || severity)
            ? "No analyses match the current search and severity filter."
            : "No incident analyses have been recorded yet."}
          isDeletingUid={deleteMutation.variables?.uid}
          onDelete={deleteAnalysis}
          onEdit={updateAnalysis}
          order="newest"
          showIncidentLink
        />
      </div>
    </PageContainer>
  )
}
