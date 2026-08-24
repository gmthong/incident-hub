import { Link } from "react-router"

import { ErrorState } from "@/components/feedback/ErrorState"
import { PageContainer } from "@/components/layout/PageContainer"


export function ForbiddenPage() {
  return (
    <PageContainer className="grid min-h-[65vh] place-items-center">
      <ErrorState
        title="You do not have access to this page"
        description="Your account is signed in, but its role does not permit this operation."
        action={<Link className="font-medium text-blue-700 hover:text-blue-800" to="/dashboard">Return to dashboard</Link>}
      />
    </PageContainer>
  )
}
