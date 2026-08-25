import { Link } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { FullPageSessionLoader } from "@/auth/AuthGuards"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageContainer } from "@/components/layout/PageContainer"


export function NotFoundPage() {
  const {status} = useAuth()
  const content = (
    <PageContainer className="grid min-h-[65vh] place-items-center">
      <EmptyState
        title="Page not found"
        description="The address may be incorrect, or the page may have moved."
        action={<Link className="font-medium text-blue-700 hover:text-blue-800" to="/">Return to IncidentHub</Link>}
      />
    </PageContainer>
  )

  if (status === "checking") {
    return <FullPageSessionLoader />
  }
  if (status === "authenticated") {
    return <AppLayout>{content}</AppLayout>
  }

  return <main>{content}</main>
}
