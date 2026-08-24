import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { API_ERROR_CODES } from "@/api/contracts"
import { refreshAccessToken, registerSessionLossHandler } from "@/api/client"
import { clearAccessToken, setAccessToken } from "@/api/token-store"
import { getCurrentUser, loginAccount, logoutAccount } from "@/features/auth/api"
import { AuthContext } from "@/features/auth/auth-context"


const CHECKING_SESSION = Object.freeze({status:"checking", user:null})
const GUEST_SESSION = Object.freeze({status:"guest", user:null})

let restorationPromise = null


async function restoreSession() {
  if (!restorationPromise) {
    restorationPromise = (async () => {
      await refreshAccessToken()
      return getCurrentUser()
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

  const login = useCallback(async (credentials) => {
    const response = await loginAccount(credentials)
    setAccessToken(response.access_token)

    try {
      const user = await getCurrentUser()
      setSession({status:"authenticated", user})
      return user
    } catch (error) {
      if (error?.code === API_ERROR_CODES.ACCOUNT_NOT_VERIFIED) {
        setSession({status:"unverified", user:response.user ?? null})
      } else {
        clearSession()
      }
      throw error
    }
  }, [clearSession])

  const logout = useCallback(async () => {
    try {
      await logoutAccount()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({
    clearSession,
    isAuthenticated:session.status === "authenticated",
    login,
    logout,
    status:session.status,
    user:session.user,
  }), [clearSession, login, logout, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
