import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { canManageIncident } from "@/auth/permissions"
import { IncidentForm } from "@/components/incidents/IncidentForm"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/ui/PageHeader"
import { API_ERROR_CODES, INCIDENT_STATUSES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import {
  editIncidentFormValues,
  isValidUuid,
  updateIncidentPayload,
} from "@/utils/incidents"


export function IncidentEditPage() {
  const {user} = useAuth()
  const {incidentUid=""} = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState("")
  const validUid = isValidUuid(incidentUid)
  const incidentQuery = useQuery({
    enabled:validUid,
    queryFn:({signal}) => apiRequest(`incidents/${incidentUid}`, {signal}),
    queryKey:queryKeys.incidents.detail(incidentUid),
  })
  const updateMutation = useMutation({
    mutationFn:(payload) => apiRequest(`incidents/${incidentUid}`, {body:payload, method:"PATCH"}),
  })

  async function submitChanges(values, dirtyFields) {
    if (
      values.status === INCIDENT_STATUSES.RESOLVED
      && dirtyFields.resolved_at
      && incidentQuery.data?.resolved_at
      && !values.resolved_at
    ) {
      setServerError("An existing resolved incident must keep a resolution time. Choose a new time or reopen the incident.")
      return
    }

    const payload = updateIncidentPayload(values, dirtyFields)
    if (Object.keys(payload).length === 0) {
      return
    }

    setServerError("")
    try {
      await updateMutation.mutateAsync(payload)
      await queryClient.invalidateQueries({queryKey:queryKeys.incidents.all})
      toast.success("Incident updated")
      navigate(`/incidents/${incidentUid}`, {replace:true})
    } catch (error) {
      const message = error?.code === API_ERROR_CODES.INVALID_INCIDENT_STATE
        ? "The requested status or resolution time is invalid. A resolution cannot precede the occurrence, and only resolved incidents may carry a resolution time."
        : getApiErrorMessage(error, "IncidentHub could not update this incident. Please try again.")
      setServerError(message)
    }
  }

  if (!validUid) {
    return (
      <PageContainer>
        <ErrorState
          className="max-w-none"
          description="The incident address does not contain a valid UUID."
          title="Invalid incident address"
        />
      </PageContainer>
    )
  }

  if (incidentQuery.isPending) {
    return (
      <PageContainer aria-busy="true" aria-live="polite" role="status">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-9 w-72" />
        <Skeleton className="mt-7 h-[32rem] max-w-3xl" />
        <span className="sr-only">Loading incident editor</span>
      </PageContainer>
    )
  }

  if (incidentQuery.isError) {
    const isMissing = incidentQuery.error?.code === API_ERROR_CODES.INCIDENT_NOT_FOUND
      || incidentQuery.error?.status === 404
    return (
      <PageContainer>
        <ErrorState
          className="max-w-none"
          description={isMissing
            ? "This incident does not exist or has been deleted."
            : "IncidentHub could not retrieve this incident for editing."}
          onRetry={isMissing ? undefined : incidentQuery.refetch}
          title={isMissing ? "Incident not found" : "Could not load incident"}
        />
      </PageContainer>
    )
  }

  const incident = incidentQuery.data
  if (!canManageIncident(user, incident)) {
    return (
      <PageContainer>
        <ErrorState
          action={(
            <Link className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700" to={`/incidents/${incident.uid}`}>
              Return to incident
            </Link>
          )}
          className="max-w-none"
          description="Engineers can edit incidents they reported or are assigned to. Leaders and administrators can edit every incident."
          title="You cannot edit this incident"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800" to={`/incidents/${incident.uid}`}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to incident
      </Link>
      <PageHeader
        className="mt-5"
        description="Update operational details and resolution state. Only changed fields are sent to the API."
        eyebrow="Incident management"
        title={`Edit ${incident.title}`}
      />
      <IncidentForm
        cancelPath={`/incidents/${incident.uid}`}
        defaultValues={editIncidentFormValues(incident)}
        isSubmitting={updateMutation.isPending}
        mode="edit"
        onSubmit={submitChanges}
        serverError={serverError}
      />
    </PageContainer>
  )
}
