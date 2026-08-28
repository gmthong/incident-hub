import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { AuthContext } from "@/auth/AuthContext"
import { API_ERROR_CODES } from "@/config/constants"
import {
  apiRequest,
  clearAccessToken,
  refreshAccessToken,
  registerSessionLossHandler,
  setAccessToken,
} from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"


const CHECKING_SESSION = Object.freeze({status:"checking", user:null})
const GUEST_SESSION = Object.freeze({status:"guest", user:null})

let restorationPromise = null


async function restoreSession() {
  if (!restorationPromise) {
    restorationPromise = (async () => {
      await refreshAccessToken()
      return apiRequest("auth/me")
    })().finally(() => {
      restorationPromise = null
    })
  }

  return restorationPromise
}


export function AuthProvider({children, initialState}) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(initialState ?? CHECKING_SESSION)

  const clearSession = useCallback(() => {
    clearAccessToken()
    queryClient.clear()
    setSession(GUEST_SESSION)
  }, [queryClient])

  useEffect(() => registerSessionLossHandler(clearSession), [clearSession])

  useEffect(() => {
    if (initialState !== undefined) {
      return undefined
    }

    let isActive = true
    restoreSession()
      .then((user) => {
        if (isActive) {
          setSession({status:"authenticated", user})
        }
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        if (error?.code === API_ERROR_CODES.ACCOUNT_NOT_VERIFIED) {
          setSession({status:"unverified", user:null})
          return
        }

        setSession(GUEST_SESSION)
      })

    return () => {
      isActive = false
    }
  }, [initialState])

  const refreshUser = useCallback(async () => {
    const user = await apiRequest("auth/me")
    queryClient.setQueryData(queryKeys.auth.me, user)
    setSession({status:"authenticated", user})
    return user
  }, [queryClient])

  const login = useCallback(async (credentials) => {
    const response = await apiRequest("auth/login", {
      auth:false,
      body:credentials,
      method:"POST",
      retryOnUnauthorized:false,
    })
    setAccessToken(response.access_token)

    try {
      const user = await refreshUser()
      return user
    } catch (error) {
      if (error?.code === API_ERROR_CODES.ACCOUNT_NOT_VERIFIED) {
        setSession({status:"unverified", user:response.user ?? null})
      } else {
        clearSession()
      }
      throw error
    }
  }, [clearSession, refreshUser])

  const logout = useCallback(async () => {
    try {
      await apiRequest("auth/logout", {method:"POST"})
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({
    clearSession,
    isAuthenticated:session.status === "authenticated",
    login,
    logout,
    refreshUser,
    status:session.status,
    user:session.user,
  }), [clearSession, login, logout, refreshUser, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
