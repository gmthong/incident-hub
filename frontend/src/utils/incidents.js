import { format, isValid } from "date-fns"
import { z } from "zod"

import { INCIDENT_STATUSES } from "@/config/constants"


export const INCIDENT_SORTS = Object.freeze({
  CREATED_DESC:"created-desc",
  OCCURRED_ASC:"occurred-asc",
  OCCURRED_DESC:"occurred-desc",
  UPDATED_DESC:"updated-desc",
})

export const INCIDENT_RELATIONSHIPS = Object.freeze({
  ALL:"all",
  ASSIGNED_TO_ME:"assigned-to-me",
  REPORTED_BY_ME:"reported-by-me",
  UNASSIGNED:"unassigned",
})

export const DEFAULT_INCIDENT_FILTERS = Object.freeze({
  category:"",
  environment:"",
  relationship:INCIDENT_RELATIONSHIPS.ALL,
  search:"",
  sort:INCIDENT_SORTS.CREATED_DESC,
  status:"",
})

const requiredShortText = (label) => z
  .string()
  .trim()
  .min(1, `${label} is required`)
  .max(50, `${label} must be 50 characters or fewer`)

const localDateTime = (label) => z
  .string()
  .min(1, `${label} is required`)
  .refine((value) => isValid(new Date(value)), `Enter a valid ${label.toLowerCase()}`)

const incidentFields = {
  affected_service:requiredShortText("Affected service"),
  environment:requiredShortText("Environment"),
  occurred_at:localDateTime("Occurred at"),
  title:requiredShortText("Title"),
}

export const incidentCreateSchema = z.object({
  ...incidentFields,
  status:z.enum(
    [INCIDENT_STATUSES.OPEN, INCIDENT_STATUSES.INVESTIGATING],
    {error:"Choose a valid initial status"},
  ),
})

export const incidentEditSchema = z.object({
  ...incidentFields,
  resolved_at:z.string(),
  status:z.enum(
    [INCIDENT_STATUSES.OPEN, INCIDENT_STATUSES.INVESTIGATING, INCIDENT_STATUSES.RESOLVED],
    {error:"Choose a valid status"},
  ),
}).superRefine((values, context) => {
  if (values.status !== INCIDENT_STATUSES.RESOLVED || !values.resolved_at) {
    return
  }

  const resolvedAt = new Date(values.resolved_at)
  if (!isValid(resolvedAt)) {
    context.addIssue({
      code:"custom",
      message:"Enter a valid resolution date and time",
      path:["resolved_at"],
    })
    return
  }

  if (resolvedAt < new Date(values.occurred_at)) {
    context.addIssue({
      code:"custom",
      message:"Resolution time cannot be before the occurrence time",
      path:["resolved_at"],
    })
  }
})


export function toLocalDateTimeInput(value) {
  if (!value) {
    return ""
  }
  const date = value instanceof Date ? value : new Date(value)
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : ""
}


export function toIsoDateTime(value) {
  const date = new Date(value)
  return isValid(date) ? date.toISOString() : null
}


export function createIncidentFormValues() {
  return {
    affected_service:"",
    environment:"",
    occurred_at:toLocalDateTimeInput(new Date()),
    status:INCIDENT_STATUSES.OPEN,
    title:"",
  }
}


export function editIncidentFormValues(incident) {
  return {
    affected_service:incident.affected_service,
    environment:incident.environment,
    occurred_at:toLocalDateTimeInput(incident.occurred_at),
    resolved_at:toLocalDateTimeInput(incident.resolved_at),
    status:incident.status,
    title:incident.title,
  }
}


export function createIncidentPayload(values) {
  return {
    affected_service:values.affected_service,
    environment:values.environment,
    occurred_at:toIsoDateTime(values.occurred_at),
    status:values.status,
    title:values.title,
  }
}


export function updateIncidentPayload(values, dirtyFields) {
  const payload = {}

  for (const field of ["title", "affected_service", "environment", "status"]) {
    if (dirtyFields[field]) {
      payload[field] = values[field]
    }
  }

  if (dirtyFields.occurred_at) {
    payload.occurred_at = toIsoDateTime(values.occurred_at)
  }

  if (
    values.status === INCIDENT_STATUSES.RESOLVED
    && dirtyFields.resolved_at
    && values.resolved_at
  ) {
    payload.resolved_at = toIsoDateTime(values.resolved_at)
  }

  return payload
}


export function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "")
}


export function shortenUuid(value) {
  if (!value) {
    return ""
  }
  return `${value.slice(0, 8)}…`
}


export function userReference(value, currentUserUid, fallback="Another user") {
  if (!value) {
    return "Unassigned"
  }
  if (value === currentUserUid) {
    return "You"
  }
  return `${fallback} (${shortenUuid(value)})`
}


export function getIncidentFilters(searchParams) {
  const status = searchParams.get("status") || ""
  const relationship = Object.values(INCIDENT_RELATIONSHIPS).includes(searchParams.get("relationship"))
    ? searchParams.get("relationship")
    : DEFAULT_INCIDENT_FILTERS.relationship
  const sort = Object.values(INCIDENT_SORTS).includes(searchParams.get("sort"))
    ? searchParams.get("sort")
    : DEFAULT_INCIDENT_FILTERS.sort

  return {
    category:searchParams.get("category") || "",
    environment:searchParams.get("environment") || "",
    relationship,
    search:searchParams.get("q") || "",
    sort,
    status:Object.values(INCIDENT_STATUSES).includes(status) ? status : "",
  }
}


export function hasActiveIncidentFilters(filters) {
  return Object.entries(DEFAULT_INCIDENT_FILTERS).some(([key, value]) => filters[key] !== value)
}


export function getIncidentFilterOptions(incidents) {
  const categoryMap = new Map()
  const environments = new Set()

  for (const incident of incidents) {
    if (incident.environment) {
      environments.add(incident.environment)
    }
    for (const category of incident.categories || []) {
      categoryMap.set(category.uid, category.name)
    }
  }

  return {
    categories:[...categoryMap].map(([uid, name]) => ({name, uid})).sort((a, b) => a.name.localeCompare(b.name)),
    environments:[...environments].sort((a, b) => a.localeCompare(b)),
  }
}


function timestamp(value) {
  const result = new Date(value).getTime()
  return Number.isNaN(result) ? 0 : result
}


export function filterAndSortIncidents(incidents, filters, currentUserUid) {
  const search = filters.search.trim().toLowerCase()
  const filtered = incidents.filter((incident) => {
    const matchesSearch = !search || [incident.title, incident.affected_service, incident.environment]
      .some((value) => value?.toLowerCase().includes(search))
    const matchesStatus = !filters.status || incident.status === filters.status
    const matchesEnvironment = !filters.environment || incident.environment === filters.environment
    const matchesCategory = !filters.category || incident.categories?.some((category) => category.uid === filters.category)

    let matchesRelationship = true
    if (filters.relationship === INCIDENT_RELATIONSHIPS.REPORTED_BY_ME) {
      matchesRelationship = incident.reporter_uid === currentUserUid
    } else if (filters.relationship === INCIDENT_RELATIONSHIPS.ASSIGNED_TO_ME) {
      matchesRelationship = incident.assigned_user_uid === currentUserUid
    } else if (filters.relationship === INCIDENT_RELATIONSHIPS.UNASSIGNED) {
      matchesRelationship = !incident.assigned_user_uid
    }

    return matchesSearch && matchesStatus && matchesEnvironment && matchesCategory && matchesRelationship
  })

  return [...filtered].sort((left, right) => {
    if (filters.sort === INCIDENT_SORTS.OCCURRED_ASC) {
      return timestamp(left.occurred_at) - timestamp(right.occurred_at)
    }
    if (filters.sort === INCIDENT_SORTS.OCCURRED_DESC) {
      return timestamp(right.occurred_at) - timestamp(left.occurred_at)
    }
    if (filters.sort === INCIDENT_SORTS.UPDATED_DESC) {
      return timestamp(right.updated_at) - timestamp(left.updated_at)
    }
    return timestamp(right.created_at) - timestamp(left.created_at)
  })
}
