import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useParams } from "react-router"

import { passwordResetConfirmSchema } from "@/auth/authSchemas"
import { AuthCard } from "@/components/auth/AuthCard"
import { AuthFormError } from "@/components/auth/AuthFormError"
import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { API_ERROR_CODES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"


export function ResetPasswordPage() {
  const {token} = useParams()
  const [succeeded, setSucceeded] = useState(false)
  const {
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    defaultValues:{confirm_password:"", new_password:""},
    resolver:zodResolver(passwordResetConfirmSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setError("root.serverError", {message:"This password-reset link is incomplete."})
      return
    }

    try {
      await apiRequest(`auth/password_reset_confirm/${encodeURIComponent(token)}`, {
        auth:false,
        body:values,
        method:"POST",
        retryOnUnauthorized:false,
      })
      reset()
      setSucceeded(true)
    } catch (error) {
      if (error?.code === API_ERROR_CODES.PASSWORDS_DO_NOT_MATCH) {
        setError("confirm_password", {message:"Passwords do not match"}, {shouldFocus:true})
        return
      }

      setError("root.serverError", {
        message:error?.code === API_ERROR_CODES.INVALID_TOKEN
          ? "This password-reset link is invalid or expired."
          : getApiErrorMessage(error, "Unable to reset your password. Please try again."),
      })
    }
  })

  return (
    <AuthCard title="Choose a new password" description="Use a strong password that you do not reuse elsewhere.">
      {succeeded ? (
        <>
          <InlineAlert title="Password reset complete" variant="success">
            You can now sign in with your new password.
          </InlineAlert>
          <Link className="mt-6 block text-center text-sm font-medium text-blue-700 hover:text-blue-800" to="/login">Continue to sign in</Link>
        </>
      ) : (
        <form className="space-y-5" noValidate onSubmit={onSubmit}>
          <AuthFormError message={errors.root?.serverError?.message} />
          <FormField error={errors.new_password?.message} id="reset-password" label="New password" required>
            <PasswordInput autoComplete="new-password" maxLength={72} {...register("new_password")} />
          </FormField>
          <FormField error={errors.confirm_password?.message} id="reset-confirm-password" label="Confirm new password" required>
            <PasswordInput autoComplete="new-password" maxLength={72} {...register("confirm_password")} />
          </FormField>
          <Button className="w-full" isLoading={isSubmitting} loadingLabel="Resetting password" type="submit">
            <KeyRound aria-hidden="true" className="size-4" />
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
