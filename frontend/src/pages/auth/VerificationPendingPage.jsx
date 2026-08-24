import { MailCheck } from "lucide-react"
import { Link, useLocation } from "react-router"

import { AuthCard } from "@/components/auth/AuthCard"
import { InlineAlert } from "@/components/feedback/InlineAlert"


export function VerificationPendingPage() {
  const location = useLocation()
  const email = location.state?.email

  return (
    <AuthCard
      title="Check your email"
      description="Your account must be verified before it can access IncidentHub."
    >
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <MailCheck aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          We sent a verification link{email ? <> to <strong className="font-medium text-slate-900">{email}</strong></> : " to your registered email address"}.
          Open that link to activate your account.
        </p>
      </div>
      <InlineAlert className="mt-5" title="No resend action yet">
        If the message has not arrived, check your spam folder. IncidentHub does not currently provide a resend endpoint.
      </InlineAlert>
      <Link className="mt-6 block text-center text-sm font-medium text-blue-700 hover:text-blue-800" to="/login">
        Return to sign in
      </Link>
    </AuthCard>
  )
}
