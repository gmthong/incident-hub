let accessToken = null


export function clearAccessToken() {
  accessToken = null
}


export function getAccessToken() {
  return accessToken
}


export function setAccessToken(token) {
  accessToken = typeof token === "string" && token.length > 0 ? token : null
}
