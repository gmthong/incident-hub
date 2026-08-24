import { zodResolver } from "@hookform/resolvers/zod"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"

import { getApiErrorMessage } from "@/api/errors"
import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { AuthCard } from "@/features/auth/AuthCard"
import { AuthFormError } from "@/features/auth/AuthFormError"
import { requestPasswordReset } from "@/features/auth/api"
import { passwordResetRequestSchema } from "@/features/auth/schemas"


export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const {
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    setError,
  } = useForm({defaultValues:{email:""}, resolver:zodResolver(passwordResetRequestSchema)})

  const onSubmit = handleSubmit(async ({email}) => {
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (error) {
      setError("root.serverError", {
        message:getApiErrorMessage(error, "Unable to request a password reset. Please try again."),
      })
    }
  })

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your account email and we will send a password-reset link if it matches an account."
    >
      {submitted ? (
        <>
          <InlineAlert title="Check your email" variant="success">
            If an IncidentHub account uses that address, a password-reset link has been sent.
          </InlineAlert>
          <Link className="mt-6 block text-center text-sm font-medium text-blue-700 hover:text-blue-800" to="/login">Return to sign in</Link>
        </>
      ) : (
        <form className="space-y-5" noValidate onSubmit={onSubmit}>
          <AuthFormError message={errors.root?.serverError?.message} />
          <FormField error={errors.email?.message} id="forgot-email" label="Email" required>
            <Input autoComplete="email" inputMode="email" maxLength={100} {...register("email")} />
          </FormField>
          <Button className="w-full" isLoading={isSubmitting} loadingLabel="Sending reset link" type="submit">
            <Mail aria-hidden="true" className="size-4" />
            Send reset link
          </Button>
          <Link className="block text-center text-sm font-medium text-blue-700 hover:text-blue-800" to="/login">Return to sign in</Link>
        </form>
      )}
    </AuthCard>
  )
}
