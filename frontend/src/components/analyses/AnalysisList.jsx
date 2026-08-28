import { ClipboardList } from "lucide-react"

import { AnalysisCard } from "@/components/analyses/AnalysisCard"
import { EmptyState } from "@/components/feedback/EmptyState"


export function AnalysisList({
  analyses,
  currentUser,
  emptyAction,
  emptyDescription="No analyses have been recorded.",
  isDeletingUid,
  onDelete,
  onEdit,
  order="oldest",
  showIncidentLink=false,
}) {
  const sortedAnalyses = [...analyses].sort((left, right) => {
    const difference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    return order === "oldest" ? difference : -difference
  })

  if (sortedAnalyses.length === 0) {
    return (
      <EmptyState
        action={emptyAction}
        className="max-w-none"
        description={emptyDescription}
        icon={ClipboardList}
        title="No analyses found"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {sortedAnalyses.map((analysis) => (
        <AnalysisCard
          analysis={analysis}
          currentUser={currentUser}
          isDeleting={isDeletingUid === analysis.uid}
          key={analysis.uid}
          onDelete={onDelete}
          onEdit={onEdit}
          showIncidentLink={showIncidentLink}
        />
      ))}
    </div>
  )
}
