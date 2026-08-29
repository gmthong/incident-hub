import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserRoundCheck, UserRoundX } from "lucide-react"
import { useForm } from "react-hook-form"

import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { API_ERROR_CODES } from "@/config/constants"
import { getApiErrorMessage } from "@/services/apiClient"
import { incidentAssignmentSchema } from "@/utils/incidents"


export function AssignmentDialog({currentAssignment, hasAssignee, onAssign, onUnassign, trigger}) {
  const [isUnassigning, setIsUnassigning] = useState(false)
  const [open, setOpen] = useState(false)
  const {
    clearErrors,
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    defaultValues:{user_email:""},
    mode:"onBlur",
    resolver:zodResolver(incidentAssignmentSchema),
  })

  function changeOpen(nextOpen) {
    if (!nextOpen && (isSubmitting || isUnassigning)) {
      return
    }
    if (nextOpen) {
      reset({user_email:""})
      clearErrors()
    }
    setOpen(nextOpen)
  }

  const assign = handleSubmit(async (values) => {
    try {
      await onAssign(values.user_email)
      setOpen(false)
    } catch (error) {
      if (error?.code === API_ERROR_CODES.USER_NOT_FOUND) {
        setError("user_email", {message:"No user was found with this email."}, {shouldFocus:true})
        return
      }
      if (error?.code === API_ERROR_CODES.INVALID_ASSIGNMENT) {
        setError("user_email", {
          message:"This account exists but is not verified or eligible for assignment.",
        }, {shouldFocus:true})
        return
      }
      setError("root.serverError", {
        message:getApiErrorMessage(error, "IncidentHub could not assign this incident."),
      })
    }
  })

  async function unassign() {
    clearErrors()
    setIsUnassigning(true)
    try {
      await onUnassign()
      setOpen(false)
    } catch (error) {
      setError("root.serverError", {
        message:getApiErrorMessage(error, "IncidentHub could not unassign this incident."),
      })
    } finally {
      setIsUnassigning(false)
    }
  }

  return (
    <Dialog
      description="Assign a verified, eligible account by entering its email address manually."
      onOpenChange={changeOpen}
      open={open}
      title="Manage assignment"
      trigger={trigger}
    >
      <form className="space-y-5" noValidate onSubmit={assign}>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {hasAssignee
            ? <UserRoundCheck aria-hidden="true" className="size-5 text-violet-700" />
            : <UserRoundX aria-hidden="true" className="size-5 text-slate-500" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current assignment</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{currentAssignment}</p>
          </div>
        </div>

        {errors.root?.serverError?.message ? (
          <InlineAlert variant="error">{errors.root.serverError.message}</InlineAlert>
        ) : null}

        <FormField
          description="The account must be verified and eligible. Leaders and administrators may enter their own email to self-assign."
          error={errors.user_email?.message}
          id="assignment-email"
          label="User email"
          required
        >
          <Input autoComplete="off" inputMode="email" maxLength={100} placeholder="engineer@example.com" {...register("user_email")} />
        </FormField>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
          <div>
            {hasAssignee ? (
              <Button disabled={isSubmitting} isLoading={isUnassigning} loadingLabel="Unassigning" onClick={unassign} variant="outline">
                <UserRoundX aria-hidden="true" className="size-4" />
                Unassign
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button disabled={isSubmitting || isUnassigning} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
            <Button disabled={isUnassigning} isLoading={isSubmitting} loadingLabel="Assigning" type="submit">
              <UserRoundCheck aria-hidden="true" className="size-4" />
              Assign user
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
