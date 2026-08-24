import { Construction } from "lucide-react"

import { Card, CardContent } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { PageContainer } from "@/components/layout/PageContainer"


export function PlaceholderPage({title, description, area="Frontend foundation"}) {
  return (
    <PageContainer>
      <PageHeader eyebrow={area} title={title} description={description} />
      <Card className="mt-6 border-dashed">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Construction aria-hidden="true" className="size-6" />
          </span>
          <div className="max-w-lg">
            <p className="font-medium text-slate-900">Route foundation is ready</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This page is intentionally a placeholder. Its feature workflow will be added in the matching development stage.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
