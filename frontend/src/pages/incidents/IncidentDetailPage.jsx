import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FilePenLine, FolderOpen, Tags, Trash2, UserCog, UserRoundCheck, UserRoundX } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { canAssignIncident, canDeleteIncident, canManageIncident } from "@/auth/permissions"
import { CategoryMultiSelect } from "@/components/categories/CategoryMultiSelect"
import { CategoryChip } from "@/components/domain/CategoryChip"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { IncidentStatusBadge } from "@/components/domain/IncidentStatusBadge"
import { AssignmentDialog } from "@/components/incidents/AssignmentDialog"
import { ErrorState } from "@/components/feedback/ErrorState"
import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { DataList } from "@/components/ui/DataList"
import { PageHeader } from "@/components/ui/PageHeader"
import { API_ERROR_CODES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import { isValidUuid, userReference } from "@/utils/incidents"


function IncidentDetailSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-9 w-96 max-w-full" />
      <Skeleton className="mt-3 h-5 w-72 max-w-full" />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <span className="sr-only">Loading incident detail</span>
    </PageContainer>
  )
}


function DetailError({description, onRetry, title}) {
  return (
    <PageContainer>
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800" to="/incidents">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to incidents
      </Link>
      <ErrorState className="mt-7 max-w-none" description={description} onRetry={onRetry} title={title} />
    </PageContainer>
  )
}


export function IncidentDetailPage() {
  const {user} = useAuth()
  const {incidentUid=""} = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const validUid = isValidUuid(incidentUid)
  const incidentQuery = useQuery({
    enabled:validUid,
    queryFn:({signal}) => apiRequest(`incidents/${incidentUid}`, {signal}),
    queryKey:queryKeys.incidents.detail(incidentUid),
  })
  const canEditCurrentIncident = Boolean(
    incidentQuery.data && canManageIncident(user, incidentQuery.data),
  )
  const categoriesQuery = useQuery({
    enabled:validUid && canEditCurrentIncident,
    queryFn:({signal}) => apiRequest("categories/", {signal}),
    queryKey:queryKeys.categories.all,
    staleTime:120_000,
  })
  const deleteMutation = useMutation({
    mutationFn:() => apiRequest(`incidents/${incidentUid}`, {method:"DELETE"}),
  })
  const categoriesMutation = useMutation({
    mutationFn:(categoryUids) => apiRequest(`incidents/${incidentUid}/categories`, {
      body:{category_uids:categoryUids},
      method:"PUT",
    }),
  })
  const assignmentMutation = useMutation({
    mutationFn:(userEmail) => apiRequest(`incidents/${incidentUid}/assignment`, {
      body:{user_email:userEmail},
      method:"PATCH",
    }),
  })

  async function updateIncidentSnapshot(updatedIncident) {
    queryClient.setQueryData(queryKeys.incidents.detail(incidentUid), (currentIncident) => (
      currentIncident
        ? {...currentIncident, ...updatedIncident, analyses:currentIncident.analyses || []}
        : currentIncident
    ))
    await queryClient.invalidateQueries({
      predicate:(query) => query.queryKey[0] === "incidents" && query.queryKey[1] !== "detail",
    })
  }

  async function replaceCategories(categoryUids) {
    const updatedIncident = await categoriesMutation.mutateAsync(categoryUids)
    await updateIncidentSnapshot(updatedIncident)
    toast.success(categoryUids.length > 0 ? "Incident categories updated" : "Incident categories cleared")
  }

  async function assignUser(userEmail) {
    const updatedIncident = await assignmentMutation.mutateAsync(userEmail)
    await updateIncidentSnapshot(updatedIncident)
    toast.success("Incident assigned")
  }

  async function unassignUser() {
    const updatedIncident = await assignmentMutation.mutateAsync(null)
    await updateIncidentSnapshot(updatedIncident)
    toast.success("Incident unassigned")
  }

  async function deleteIncident() {
    try {
      await deleteMutation.mutateAsync()
      queryClient.removeQueries({exact:true, queryKey:queryKeys.incidents.detail(incidentUid)})
      toast.success("Incident deleted")
      navigate("/incidents", {replace:true})
      await queryClient.invalidateQueries({
        predicate:(query) => query.queryKey[0] === "incidents" && query.queryKey[1] !== "detail",
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, "IncidentHub could not delete this incident."))
    }
  }

  if (!validUid) {
    return (
      <DetailError
        description="The incident address does not contain a valid UUID. Return to the incident list and choose an incident."
        title="Invalid incident address"
      />
    )
  }

  if (incidentQuery.isPending) {
    return <IncidentDetailSkeleton />
  }

  if (incidentQuery.isError) {
    const isMissing = incidentQuery.error?.code === API_ERROR_CODES.INCIDENT_NOT_FOUND
      || incidentQuery.error?.status === 404
    const isForbidden = incidentQuery.error?.code === API_ERROR_CODES.INSUFFICIENT_PERMISSIONS
      || incidentQuery.error?.status === 403

    return (
      <DetailError
        description={isMissing
          ? "This incident does not exist or has been deleted."
          : isForbidden
            ? "Your account does not have permission to view this incident."
            : "IncidentHub could not retrieve this incident. Check the backend connection and try again."}
        onRetry={isMissing || isForbidden ? undefined : incidentQuery.refetch}
        title={isMissing ? "Incident not found" : isForbidden ? "Access denied" : "Could not load incident"}
      />
    )
  }

  const incident = incidentQuery.data
  const canEdit = canManageIncident(user, incident)
  const canDelete = canDeleteIncident(user)
  const reporter = userReference(incident.reporter_uid, user.uid, "Reporter")
  const assignee = userReference(incident.assigned_user_uid, user.uid, "Assigned user")

  return (
    <PageContainer>
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800" to="/incidents">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to incidents
      </Link>

      <PageHeader
        actions={(
          <>
            {canEdit ? (
              <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50" to={`/incidents/${incident.uid}/edit`}>
                <FilePenLine aria-hidden="true" className="size-4" />
                Edit incident
              </Link>
            ) : null}
            {canDelete ? (
              <ConfirmDialog
                confirmLabel="Delete incident"
                description={`Delete “${incident.title}”? Its analyses and category associations will also be permanently deleted.`}
                onConfirm={deleteIncident}
                title="Delete incident"
                trigger={(
                  <Button isLoading={deleteMutation.isPending} loadingLabel="Deleting" variant="destructive">
                    <Trash2 aria-hidden="true" className="size-4" />
                    Delete
                  </Button>
                )}
              />
            ) : null}
          </>
        )}
        className="mt-5"
        description={`${incident.affected_service} · ${incident.environment}`}
        eyebrow="Incident details"
        title={incident.title}
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Operational details</CardTitle>
              <IncidentStatusBadge status={incident.status} />
            </CardHeader>
            <CardContent>
              <DataList items={[
                {label:"Affected service", value:incident.affected_service},
                {label:"Environment", value:incident.environment},
                {label:"Occurred at", value:<DateTimeDisplay value={incident.occurred_at} />},
                {label:"Resolved at", value:<DateTimeDisplay value={incident.resolved_at} />},
                {label:"Reporter", value:reporter},
                {label:"Assigned user", value:assignee},
              ]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Categories</CardTitle>
                <p className="mt-1 text-sm text-slate-600">Operational classifications attached to this incident.</p>
              </div>
              {canEdit && categoriesQuery.isSuccess ? (
                <CategoryMultiSelect
                  categories={categoriesQuery.data}
                  initialCategoryUids={(incident.categories || []).map((category) => category.uid)}
                  onSave={replaceCategories}
                  trigger={(
                    <Button size="sm" variant="outline">
                      <Tags aria-hidden="true" className="size-4" />
                      Manage
                    </Button>
                  )}
                />
              ) : null}
            </CardHeader>
            <CardContent>
              {canEdit && categoriesQuery.isPending ? (
                <p className="mb-4 text-sm text-slate-500">Loading available categories…</p>
              ) : null}
              {canEdit && categoriesQuery.isError ? (
                <InlineAlert className="mb-4" title="Could not load the category catalog" variant="error">
                  <button className="font-medium underline" onClick={() => categoriesQuery.refetch()} type="button">Try again</button>
                </InlineAlert>
              ) : null}
              {incident.categories?.length ? (
                <div className="flex flex-wrap gap-2">
                  {incident.categories.map((category) => <CategoryChip key={category.uid} name={category.name} />)}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <FolderOpen aria-hidden="true" className="size-5 text-slate-400" />
                  No categories have been assigned.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Assignment</CardTitle>
                <p className="mt-1 text-sm text-slate-600">Current incident ownership.</p>
              </div>
              {canAssignIncident(user) ? (
                <AssignmentDialog
                  currentAssignment={assignee}
                  hasAssignee={Boolean(incident.assigned_user_uid)}
                  onAssign={assignUser}
                  onUnassign={unassignUser}
                  trigger={(
                    <Button size="sm" variant="outline">
                      <UserCog aria-hidden="true" className="size-4" />
                      Manage
                    </Button>
                  )}
                />
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                {incident.assigned_user_uid
                  ? <UserRoundCheck aria-hidden="true" className="size-5 text-violet-700" />
                  : <UserRoundX aria-hidden="true" className="size-5 text-slate-500" />}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned user</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{assignee}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <DataList items={[
                {label:"Incident UUID", value:<span className="break-all font-mono text-xs">{incident.uid}</span>},
                {label:"Created", value:<DateTimeDisplay value={incident.created_at} />},
                {label:"Last updated", value:<DateTimeDisplay value={incident.updated_at} />},
              ]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700">
                <UserRoundCheck aria-hidden="true" className="size-4" />
              </span>
              <div>
                <CardTitle>Analyses</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{incident.analyses?.length || 0} recorded</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Existing records are included in this count. Analysis creation and management controls will be added here next.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
