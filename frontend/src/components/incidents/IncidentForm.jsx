import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Send } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { Link } from "react-router"

import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { INCIDENT_STATUSES } from "@/config/constants"
import { incidentCreateSchema, incidentEditSchema } from "@/utils/incidents"


export function IncidentForm({cancelPath="/incidents", defaultValues, isSubmitting, mode="create", onSubmit, serverError}) {
  const isEdit = mode === "edit"
  const {
    control,
    formState:{dirtyFields, errors, isDirty},
    handleSubmit,
    register,
  } = useForm({
    defaultValues,
    mode:"onBlur",
    resolver:zodResolver(isEdit ? incidentEditSchema : incidentCreateSchema),
  })
  const selectedStatus = useWatch({control, name:"status"})

  return (
    <Card className="mt-7 max-w-3xl">
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit((values) => onSubmit(values, dirtyFields))}>
          {serverError ? (
            <InlineAlert title="Could not save incident" variant="error">{serverError}</InlineAlert>
          ) : null}

          <FormField error={errors.title?.message} id="incident-title" label="Title" required>
            <Input maxLength={50} placeholder="Brief incident title" {...register("title")} />
          </FormField>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField error={errors.affected_service?.message} id="incident-service" label="Affected service" required>
              <Input maxLength={50} placeholder="e.g. Payments API" {...register("affected_service")} />
            </FormField>
            <FormField error={errors.environment?.message} id="incident-environment" label="Environment" required>
              <Input maxLength={50} placeholder="e.g. Production" {...register("environment")} />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              description="Entered in your local timezone and sent to the API as an ISO timestamp."
              error={errors.occurred_at?.message}
              id="incident-occurred-at"
              label="Occurred at"
              required
            >
              <Input type="datetime-local" {...register("occurred_at")} />
            </FormField>
            <FormField error={errors.status?.message} id="incident-status" label={isEdit ? "Status" : "Initial status"} required>
              <Select {...register("status")}>
                <option value={INCIDENT_STATUSES.OPEN}>Open</option>
                <option value={INCIDENT_STATUSES.INVESTIGATING}>Investigating</option>
                {isEdit ? <option value={INCIDENT_STATUSES.RESOLVED}>Resolved</option> : null}
              </Select>
            </FormField>
          </div>

          {isEdit && selectedStatus === INCIDENT_STATUSES.RESOLVED ? (
            <FormField
              description="Optional. Leave blank when resolving for the first time and the server will use the current time."
              error={errors.resolved_at?.message}
              id="incident-resolved-at"
              label="Resolved at"
            >
              <Input type="datetime-local" {...register("resolved_at")} />
            </FormField>
          ) : null}

          {isEdit && selectedStatus !== INCIDENT_STATUSES.RESOLVED ? (
            <InlineAlert title="Open incident state">
              Saving an open or investigating status clears any existing resolution timestamp.
            </InlineAlert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              to={cancelPath}
            >
              Cancel
            </Link>
            <Button disabled={isEdit && !isDirty} isLoading={isSubmitting} loadingLabel="Saving incident" type="submit">
              {isEdit ? <Save aria-hidden="true" className="size-4" /> : <Send aria-hidden="true" className="size-4" />}
              {isEdit ? "Save changes" : "Report incident"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
