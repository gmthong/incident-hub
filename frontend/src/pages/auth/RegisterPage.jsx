import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"

import { registrationSchema } from "@/auth/authSchemas"
import { AuthCard } from "@/components/auth/AuthCard"
import { AuthFormError } from "@/components/auth/AuthFormError"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { API_ERROR_CODES } from "@/config/constants"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"


export function RegisterPage() {
  const navigate = useNavigate()
  const {
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues:{
      confirmPassword:"",
      email:"",
      first_name:"",
      last_name:"",
      password:"",
      username:"",
    },
    resolver:zodResolver(registrationSchema),
  })

  const onSubmit = handleSubmit(async ({confirmPassword:_confirmPassword, ...userData}) => {
    try {
      await apiRequest("auth/signup", {
        auth:false,
        body:userData,
        method:"POST",
        retryOnUnauthorized:false,
      })
      navigate("/verification-pending", {replace:true, state:{email:userData.email}})
    } catch (error) {
      if (error?.code === API_ERROR_CODES.USER_EXISTS) {
        setError("email", {message:"An account with this email already exists."}, {shouldFocus:true})
        return
      }
      if (error?.code === API_ERROR_CODES.USERNAME_EXISTS) {
        setError("username", {message:"This username is already in use."}, {shouldFocus:true})
        return
      }

      setError("root.serverError", {
        message:getApiErrorMessage(error, "Unable to create your account. Please try again."),
      })
    }
  })

  return (
    <AuthCard
      title="Create account"
      description="Register an engineer account. You will verify your email before signing in."
    >
      <form className="space-y-5" noValidate onSubmit={onSubmit}>
        <AuthFormError message={errors.root?.serverError?.message} />
        <FormField error={errors.username?.message} id="register-username" label="Username" required>
          <Input autoComplete="username" maxLength={50} {...register("username")} />
        </FormField>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={errors.first_name?.message} id="register-first-name" label="First name" required>
            <Input autoComplete="given-name" maxLength={50} {...register("first_name")} />
          </FormField>
          <FormField error={errors.last_name?.message} id="register-last-name" label="Last name" required>
            <Input autoComplete="family-name" maxLength={50} {...register("last_name")} />
          </FormField>
        </div>
        <FormField error={errors.email?.message} id="register-email" label="Email" required>
          <Input autoComplete="email" inputMode="email" maxLength={100} {...register("email")} />
        </FormField>
        <FormField error={errors.password?.message} id="register-password" label="Password" required>
          <PasswordInput autoComplete="new-password" maxLength={100} {...register("password")} />
        </FormField>
        <FormField error={errors.confirmPassword?.message} id="register-confirm-password" label="Confirm password" required>
          <PasswordInput autoComplete="new-password" maxLength={100} {...register("confirmPassword")} />
        </FormField>
        <Button className="w-full" isLoading={isSubmitting} loadingLabel="Creating account" type="submit">
          <UserPlus aria-hidden="true" className="size-4" />
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-medium text-blue-700 hover:text-blue-800" to="/login">Sign in</Link>
      </p>
    </AuthCard>
  )
}
