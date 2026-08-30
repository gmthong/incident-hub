import { INCIDENT_STATUSES } from "@/config/constants"


export function getDashboardSummary(summary) {
  const counts = {
    assignedToMe:summary?.assigned_to_me || 0,
    investigating:summary?.investigating || 0,
    open:summary?.open || 0,
    reportedByMe:summary?.reported_by_me || 0,
    resolved:summary?.resolved || 0,
    total:summary?.total || 0,
  }

  const percentage = (count) => counts.total === 0 ? 0 : Math.round((count / counts.total) * 100)

  return {
    counts,
    recentIncidents:Array.isArray(summary?.recent_incidents) ? summary.recent_incidents : [],
    statusDistribution:[
      {count:counts.open, label:"Open", percentage:percentage(counts.open), status:INCIDENT_STATUSES.OPEN},
      {count:counts.investigating, label:"Investigating", percentage:percentage(counts.investigating), status:INCIDENT_STATUSES.INVESTIGATING},
      {count:counts.resolved, label:"Resolved", percentage:percentage(counts.resolved), status:INCIDENT_STATUSES.RESOLVED},
    ],
  }
}
