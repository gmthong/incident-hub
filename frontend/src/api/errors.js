export class ApiError extends Error {
  constructor({message, status=0, code="request_failed", details=null, isNetworkError=false}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
    this.isNetworkError = isNetworkError
  }
}


export function getApiErrorMessage(error, fallback="Something went wrong. Please try again.") {
  return error instanceof ApiError && error.message ? error.message : fallback
}
