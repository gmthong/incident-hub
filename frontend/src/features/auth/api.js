import { apiRequest } from "@/api/client"


export function getCurrentUser({signal}={}) {
  return apiRequest("auth/me", {signal})
}


export function loginAccount(credentials) {
  return apiRequest("auth/login", {
    auth:false,
    body:credentials,
    method:"POST",
    retryOnUnauthorized:false,
  })
}


export function logoutAccount() {
  return apiRequest("auth/logout", {method:"POST"})
}


export function registerAccount(userData) {
  return apiRequest("auth/signup", {
    auth:false,
    body:userData,
    method:"POST",
    retryOnUnauthorized:false,
  })
}


export function requestPasswordReset(email) {
  return apiRequest("auth/password_reset_request", {
    auth:false,
    body:{email},
    method:"POST",
    retryOnUnauthorized:false,
  })
}


export function resetPassword(token, passwordData) {
  return apiRequest(`auth/password_reset_confirm/${encodeURIComponent(token)}`, {
    auth:false,
    body:passwordData,
    method:"POST",
    retryOnUnauthorized:false,
  })
}


export function verifyAccount(token, {signal}={}) {
  return apiRequest(`auth/verify/${encodeURIComponent(token)}`, {
    auth:false,
    retryOnUnauthorized:false,
    signal,
  })
}
