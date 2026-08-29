import { FilePenLine, Link2, Trash2 } from "lucide-react"
import { Link } from "react-router"

import { canModifyAnalysis } from "@/auth/permissions"
import { AnalysisSeverityBadge } from "@/components/domain/AnalysisSeverityBadge"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { AnalysisFormDialog } from "@/components/analyses/AnalysisFormDialog"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { userReference } from "@/utils/incidents"


export function AnalysisCard({analysis, currentUser, isDeleting=false, onDelete, onEdit, showIncidentLink=false}) {
  const canModify = canModifyAnalysis(currentUser, analysis)
  const author = userReference(analysis.user_uid, currentUser?.uid, "Author")
  const preview = analysis.analysis_text.length > 80
    ? `${analysis.analysis_text.slice(0, 80)}…`
    : analysis.analysis_text

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AnalysisSeverityBadge severity={analysis.severity} />
            <span className="text-xs text-slate-500">By {author}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Created <DateTimeDisplay value={analysis.created_at} />
            {analysis.updated_at !== analysis.created_at ? <> · Updated <DateTimeDisplay value={analysis.updated_at} /></> : null}
          </p>
        </div>

        {canModify ? (
          <div className="flex shrink-0 gap-2">
            <AnalysisFormDialog
              analysis={analysis}
              onSave={(values) => onEdit(analysis, values)}
              trigger={(
                <Button size="sm" variant="outline">
                  <FilePenLine aria-hidden="true" className="size-4" />
                  Edit
                </Button>
              )}
            />
            <ConfirmDialog
              confirmLabel="Delete analysis"
              description={`Delete “${preview}”? This cannot be undone.`}
              isPending={isDeleting}
              onConfirm={() => onDelete(analysis)}
              title="Delete analysis"
              trigger={(
                <Button disabled={isDeleting} size="sm" variant="destructive">
                  <Trash2 aria-hidden="true" className="size-4" />
                  Delete
                </Button>
              )}
            />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{analysis.analysis_text}</p>
        {showIncidentLink ? (
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800" to={`/incidents/${analysis.incident_uid}`}>
            <Link2 aria-hidden="true" className="size-4" />
            Open incident {analysis.incident_uid.slice(0, 8)}…
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}
