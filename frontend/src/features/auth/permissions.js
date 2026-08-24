import { USER_ROLES } from "@/api/contracts"


export function canManageIncident(user, incident) {
  if (!user || !incident) {
    return false
  }
  if ([USER_ROLES.ADMIN, USER_ROLES.LEADER].includes(user.role)) {
    return true
  }

  return incident.reporter_uid === user.uid || incident.assigned_user_uid === user.uid
}


export function canAssignIncident(user) {
  return Boolean(user && [USER_ROLES.ADMIN, USER_ROLES.LEADER].includes(user.role))
}


export function canDeleteIncident(user) {
  return user?.role === USER_ROLES.ADMIN
}


export function canModifyAnalysis(user, analysis) {
  return Boolean(user && analysis && (
    user.role === USER_ROLES.ADMIN || analysis.user_uid === user.uid
  ))
}


export function canManageAdministration(user) {
  return user?.role === USER_ROLES.ADMIN
}
