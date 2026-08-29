import { zodResolver } from "@hookform/resolvers/zod"
import { LogIn } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import { AuthFormError } from "@/components/auth/AuthFormError"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { API_ERROR_CODES } from "@/config/constants"
import { loginSchema } from "@/auth/authSchemas"
import { getApiErrorMessage } from "@/services/apiClient"


function intendedDestination(location) {
  const from = location.state?.from
  if (!from?.pathname || !from.pathname.startsWith("/") || from.pathname === "/login") {
    return "/dashboard"
  }

  return `${from.pathname}${from.search || ""}${from.hash || ""}`
}


export function LoginPage() {
  const {login} = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues:{email:"", password:""},
    resolver:zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
      navigate(intendedDestination(location), {replace:true})
    } catch (error) {
      if (error?.code === API_ERROR_CODES.ACCOUNT_NOT_VERIFIED) {
        navigate("/verification-pending", {replace:true, state:{email:values.email}})
        return
      }

      setError("root.serverError", {
        message:error?.code === API_ERROR_CODES.INVALID_CREDENTIALS
          ? "The email or password is incorrect."
          : getApiErrorMessage(error, "Unable to sign in. Please try again."),
      })
    }
  })

  return (
    <AuthCard
      title="Sign in"
      description="Use your verified IncidentHub account to open the operations workspace."
    >
      <form className="space-y-5" noValidate onSubmit={onSubmit}>
        <AuthFormError message={errors.root?.serverError?.message} />
        <FormField error={errors.email?.message} id="login-email" label="Email" required>
          <Input autoComplete="email" inputMode="email" maxLength={100} {...register("email")} />
        </FormField>
        <FormField error={errors.password?.message} id="login-password" label="Password" required>
          <PasswordInput autoComplete="current-password" maxLength={72} {...register("password")} />
        </FormField>
        <div className="flex justify-end">
          <Link className="text-sm font-medium text-blue-700 hover:text-blue-800" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <Button className="w-full" isLoading={isSubmitting} loadingLabel="Signing in" type="submit">
          <LogIn aria-hidden="true" className="size-4" />
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-medium text-blue-700 hover:text-blue-800" to="/register">Create one</Link>
      </p>
    </AuthCard>
  )
}
