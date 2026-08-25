import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { IncidentForm } from "@/components/incidents/IncidentForm"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/ui/PageHeader"
import { API_ERROR_CODES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import { createIncidentFormValues, createIncidentPayload } from "@/utils/incidents"


export function IncidentCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState("")
  const createMutation = useMutation({
    mutationFn:(payload) => apiRequest("incidents/", {body:payload, method:"POST"}),
  })

  async function submitIncident(values) {
    setServerError("")
    try {
      const incident = await createMutation.mutateAsync(createIncidentPayload(values))
      await queryClient.invalidateQueries({queryKey:queryKeys.incidents.all})
      queryClient.setQueryData(queryKeys.incidents.detail(incident.uid), incident)
      toast.success("Incident reported successfully")
      navigate(`/incidents/${incident.uid}`, {replace:true})
    } catch (error) {
      const message = error?.code === API_ERROR_CODES.INVALID_INCIDENT_STATE
        ? "A new incident must be open or investigating. Review the incident status and try again."
        : getApiErrorMessage(error, "IncidentHub could not report the incident. Please try again.")
      setServerError(message)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        description="Record the operational impact and when it first occurred. You can add categories, assignment, and analysis from the incident page."
        eyebrow="Operations"
        title="Report incident"
      />
      <IncidentForm
        defaultValues={createIncidentFormValues()}
        isSubmitting={createMutation.isPending}
        onSubmit={submitIncident}
        serverError={serverError}
      />
    </PageContainer>
  )
}
