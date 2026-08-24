// Values shared with the FastAPI enums and error responses.
export const USER_ROLES = Object.freeze({
  ADMIN:"admin",
  ENGINEER:"engineer",
  LEADER:"leader",
})

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES))

export const INCIDENT_STATUSES = Object.freeze({
  INVESTIGATING:"INVESTIGATING",
  OPEN:"OPEN",
  RESOLVED:"RESOLVED",
})

export const INCIDENT_STATUS_VALUES = Object.freeze(Object.values(INCIDENT_STATUSES))

export const ANALYSIS_SEVERITIES = Object.freeze({
  CRITICAL:"CRITICAL",
  HIGH:"HIGH",
  LOW:"LOW",
  MEDIUM:"MEDIUM",
})

export const ANALYSIS_SEVERITY_VALUES = Object.freeze(Object.values(ANALYSIS_SEVERITIES))

/**
 * @typedef {"engineer" | "leader" | "admin"} UserRole
 *
 * @typedef {Object} User
 * @property {string} uid
 * @property {string} username
 * @property {string} email
 * @property {string | null} first_name
 * @property {string | null} last_name
 * @property {UserRole} role
 * @property {boolean} is_verified
 * @property {string} created_at
 * @property {string} updated_at
 *
 * @typedef {Object} IncidentCategory
 * @property {string} uid
 * @property {string} name
 * @property {string} created_at
 *
 * @typedef {"OPEN" | "INVESTIGATING" | "RESOLVED"} IncidentStatus
 *
 * @typedef {Object} Incident
 * @property {string} uid
 * @property {string} title
 * @property {string} affected_service
 * @property {string} environment
 * @property {string} occurred_at
 * @property {IncidentStatus} status
 * @property {string} reporter_uid
 * @property {string | null} assigned_user_uid
 * @property {string | null} resolved_at
 * @property {string} created_at
 * @property {string} updated_at
 * @property {IncidentCategory[]} categories
 *
 * @typedef {"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} AnalysisSeverity
 *
 * @typedef {Object} IncidentAnalysis
 * @property {string} uid
 * @property {AnalysisSeverity} severity
 * @property {string} analysis_text
 * @property {string} user_uid
 * @property {string} incident_uid
 * @property {string} created_at
 * @property {string} updated_at
 *
 * @typedef {Incident & {analyses:IncidentAnalysis[]}} IncidentDetails
 *
 * @typedef {Object} AuthResponse
 * @property {string} message
 * @property {string} access_token
 * @property {string} refresh_token The frontend deliberately ignores this value.
 * @property {Pick<User, "uid" | "email" | "role">} user
 *
 * @typedef {Object} FastApiValidationIssue
 * @property {string} type
 * @property {(string | number)[]} loc
 * @property {string} msg
 * @property {*} [input]
 *
 * @typedef {Object} ApiErrorPayload
 * @property {string} [message]
 * @property {string} [error_code]
 * @property {FastApiValidationIssue[]} [detail]
 */

export const API_ERROR_CODES = Object.freeze({
  ACCOUNT_NOT_VERIFIED:"account_not_verified",
  INVALID_CREDENTIALS:"invalid_credentials",
  INVALID_TOKEN:"invalid_token",
  PASSWORDS_DO_NOT_MATCH:"passwords_do_not_match",
  USER_EXISTS:"user_exists",
  USERNAME_EXISTS:"username_exists",
})
