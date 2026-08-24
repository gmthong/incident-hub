import { ApiError } from "@/api/errors"
import { clearAccessToken, getAccessToken, setAccessToken } from "@/api/token-store"
import { API_BASE_URL } from "@/config/environment"


let refreshPromise = null
let sessionLossHandler = null


function buildUrl(path) {
  const normalizedPath = String(path).replace(/^\/+/, "")
  return new URL(normalizedPath, `${API_BASE_URL}/`).toString()
}


function createHeaders(headers, body) {
  const requestHeaders = new Headers(headers)
  const shouldUseJson = body !== undefined
    && body !== null
    && !(body instanceof FormData)
    && !(body instanceof URLSearchParams)

  if (shouldUseJson && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  return {requestHeaders, shouldUseJson}
}


async function parseResponseBody(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}


function validationMessage(details) {
  if (!Array.isArray(details) || details.length === 0) {
    return null
  }

  return details.map((issue) => {
    const field = Array.isArray(issue.loc) ? issue.loc.at(-1) : null
    return field ? `${String(field).replaceAll("_", " ")}: ${issue.msg}` : issue.msg
  }).join(". ")
}


function toApiError(response, payload) {
  const details = payload && typeof payload === "object" ? payload.detail ?? null : null
  const message = payload && typeof payload === "object"
    ? payload.message || validationMessage(details)
    : null

  return new ApiError({
    code:payload && typeof payload === "object" ? payload.error_code || "request_failed" : "request_failed",
    details,
    message:message || `Request failed with status ${response.status}`,
    status:response.status,
  })
}


async function performFetch(path, options={}) {
  const {
    auth=true,
    body,
    headers,
    method="GET",
    signal,
  } = options
  const {requestHeaders, shouldUseJson} = createHeaders(headers, body)
  const token = getAccessToken()

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(buildUrl(path), {
      body:shouldUseJson ? JSON.stringify(body) : body,
      credentials:"include",
      headers:requestHeaders,
      method,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    throw new ApiError({
      code:"network_error",
      isNetworkError:true,
      message:"Unable to reach IncidentHub. Check your connection and try again.",
    })
  }

  const payload = await parseResponseBody(response)
  return {payload, response}
}


function loseSession() {
  clearAccessToken()
  sessionLossHandler?.()
}


export function registerSessionLossHandler(handler) {
  sessionLossHandler = handler
  return () => {
    if (sessionLossHandler === handler) {
      sessionLossHandler = null
    }
  }
}


export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const {payload, response} = await performFetch("auth/refresh_token", {auth:false})
        if (!response.ok || !payload?.access_token) {
          throw toApiError(response, payload)
        }

        setAccessToken(payload.access_token)
        return payload.access_token
      } catch (error) {
        loseSession()
        throw error
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}


export async function apiRequest(path, options={}) {
  const {
    auth=true,
    retryOnUnauthorized=true,
    ...requestOptions
  } = options
  const {payload, response} = await performFetch(path, {...requestOptions, auth})

  if (response.ok) {
    return payload
  }

  if (response.status === 401 && auth && retryOnUnauthorized) {
    await refreshAccessToken()
    const retried = await performFetch(path, {...requestOptions, auth:true})
    if (retried.response.ok) {
      return retried.payload
    }

    if (retried.response.status === 401) {
      loseSession()
    }
    throw toApiError(retried.response, retried.payload)
  }

  throw toApiError(response, payload)
}
