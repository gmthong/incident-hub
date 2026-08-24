import { Link } from "react-router"

import { EmptyState } from "@/components/feedback/EmptyState"
import { PageContainer } from "@/components/layout/PageContainer"


export function NotFoundPage() {
  return (
    <PageContainer className="grid min-h-[65vh] place-items-center">
      <EmptyState
        title="Page not found"
        description="The address may be incorrect, or the page may have moved."
        action={<Link className="font-medium text-blue-700 hover:text-blue-800" to="/">Return to IncidentHub</Link>}
      />
    </PageContainer>
  )
}
