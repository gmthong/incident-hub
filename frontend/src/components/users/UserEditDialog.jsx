import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { API_ERROR_CODES, USER_ROLES } from "@/config/constants"
import { getApiErrorMessage } from "@/services/apiClient"
import { userUpdateSchema } from "@/utils/users"


export function UserEditDialog({isCurrentUser, onSave, trigger, user}) {
  const [open, setOpen] = useState(false)
  const {
    control,
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    defaultValues:{
      first_name:user.first_name || "",
      last_name:user.last_name || "",
      role:user.role,
      username:user.username,
    },
    mode:"onBlur",
    resolver:zodResolver(userUpdateSchema),
  })
  const selectedRole = useWatch({control, name:"role"})
  const isChangingOwnRole = isCurrentUser && selectedRole !== user.role

  function changeOpen(nextOpen) {
    if (!nextOpen && isSubmitting) {
      return
    }
    if (nextOpen) {
      reset({
        first_name:user.first_name || "",
        last_name:user.last_name || "",
        role:user.role,
        username:user.username,
      })
    }
    setOpen(nextOpen)
  }

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values)
      setOpen(false)
    } catch (error) {
      if (error?.code === API_ERROR_CODES.USERNAME_EXISTS) {
        setError("username", {message:"This username is already in use."}, {shouldFocus:true})
        return
      }
      setError("root.serverError", {
        message:getApiErrorMessage(error, "IncidentHub could not update this user."),
      })
    }
  })

  return (
    <Dialog
      className="max-w-2xl"
      description="Update supported profile fields and access role. Identity and verification fields remain read-only."
      onOpenChange={changeOpen}
      open={open}
      title={`Edit ${user.username}`}
      trigger={trigger}
    >
      <form className="space-y-5" noValidate onSubmit={submit}>
        {errors.root?.serverError?.message ? (
          <InlineAlert variant="error">{errors.root.serverError.message}</InlineAlert>
        ) : null}
        {isChangingOwnRole ? (
          <InlineAlert title="You are changing your own role" variant="warning">
            Saving this change may immediately remove your access to administration pages.
          </InlineAlert>
        ) : null}

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 break-all text-slate-800">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</p>
            <p className="mt-1"><Badge variant={user.is_verified ? "emerald" : "amber"}>{user.is_verified ? "Verified" : "Not verified"}</Badge></p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User UUID</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">{user.uid}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-slate-800"><DateTimeDisplay value={user.created_at} /></p>
          </div>
        </div>

        <FormField error={errors.username?.message} id={`admin-username-${user.uid}`} label="Username" required>
          <Input maxLength={50} {...register("username")} />
        </FormField>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={errors.first_name?.message} id={`admin-first-name-${user.uid}`} label="First name">
            <Input maxLength={50} placeholder="Not provided" {...register("first_name")} />
          </FormField>
          <FormField error={errors.last_name?.message} id={`admin-last-name-${user.uid}`} label="Last name">
            <Input maxLength={50} placeholder="Not provided" {...register("last_name")} />
          </FormField>
        </div>

        <FormField error={errors.role?.message} id={`admin-role-${user.uid}`} label="Role" required>
          <Select {...register("role")}>
            <option value={USER_ROLES.ENGINEER}>Engineer</option>
            <option value={USER_ROLES.LEADER}>Leader</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
          </Select>
        </FormField>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button isLoading={isSubmitting} loadingLabel="Saving user" type="submit">
            <Save aria-hidden="true" className="size-4" />
            Save user
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
