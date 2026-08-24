import { useQuery } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"
import { Link, useParams } from "react-router"

import { API_ERROR_CODES } from "@/api/contracts"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Spinner } from "@/components/feedback/Spinner"
import { AuthCard } from "@/features/auth/AuthCard"
import { verifyAccount } from "@/features/auth/api"


export function VerifyAccountPage() {
  const {token} = useParams()
  const verification = useQuery({
    enabled:Boolean(token),
    // Do not consume React Query's cancellation signal here: keeping this
    // idempotent request in flight lets Strict Mode reuse the same promise.
    queryFn:() => verifyAccount(token),
    queryKey:["auth", "verify-account", token],
    retry:false,
    staleTime:Infinity,
  })

  if (verification.isPending) {
    return (
      <AuthCard title="Verifying account" description="Please keep this page open for a moment.">
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-sm text-slate-600">
          <Spinner className="size-6 text-blue-600" label="Verifying account" />
          Checking your verification link…
        </div>
      </AuthCard>
    )
  }

  if (verification.isError) {
    const isInvalidToken = verification.error?.code === API_ERROR_CODES.INVALID_TOKEN
    return (
      <AuthCard title="Verification unsuccessful">
        <ErrorState
          className="border-0 p-2 shadow-none"
          title={isInvalidToken ? "This verification link is invalid or expired" : "We could not verify your account"}
          description={isInvalidToken
            ? "Use the latest verification email associated with your registration."
            : "Check your connection and try the verification link again."}
          action={isInvalidToken ? (
            <Link className="font-medium text-blue-700 hover:text-blue-800" to="/register">Register again</Link>
          ) : undefined}
          actionLabel="Try again"
          onRetry={isInvalidToken ? undefined : verification.refetch}
        />
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Account verified" description="Your IncidentHub account is ready to use.">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <CircleCheck aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-4 text-sm leading-6 text-slate-600">Sign in with the email address and password you registered.</p>
        <Link className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700" to="/login">
          Continue to sign in
        </Link>
      </div>
    </AuthCard>
  )
}
