import { INCIDENT_STATUSES } from "@/config/constants"


export function getDashboardSummary(incidents, userUid) {
  const incidentList = Array.isArray(incidents) ? incidents : []
  const counts = {
    assignedToMe:0,
    investigating:0,
    open:0,
    reportedByMe:0,
    resolved:0,
    total:incidentList.length,
  }

  for (const incident of incidentList) {
    if (incident.status === INCIDENT_STATUSES.OPEN) {
      counts.open += 1
    } else if (incident.status === INCIDENT_STATUSES.INVESTIGATING) {
      counts.investigating += 1
    } else if (incident.status === INCIDENT_STATUSES.RESOLVED) {
      counts.resolved += 1
    }

    if (userUid && incident.reporter_uid === userUid) {
      counts.reportedByMe += 1
    }
    if (userUid && incident.assigned_user_uid === userUid) {
      counts.assignedToMe += 1
    }
  }

  const percentage = (count) => counts.total === 0 ? 0 : Math.round((count / counts.total) * 100)

  return {
    counts,
    recentIncidents:incidentList.slice(0, 5),
    statusDistribution:[
      {count:counts.open, label:"Open", percentage:percentage(counts.open), status:INCIDENT_STATUSES.OPEN},
      {count:counts.investigating, label:"Investigating", percentage:percentage(counts.investigating), status:INCIDENT_STATUSES.INVESTIGATING},
      {count:counts.resolved, label:"Resolved", percentage:percentage(counts.resolved), status:INCIDENT_STATUSES.RESOLVED},
    ],
  }
}
