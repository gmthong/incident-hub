import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"

import { createAppQueryClient } from "@/lib/query-client"
import { AuthProvider } from "@/features/auth/AuthProvider"


export function AppProviders({children, initialAuthState, queryClient, showDevtools=import.meta.env.DEV}) {
  const [client] = useState(() => queryClient ?? createAppQueryClient())

  return (
    <QueryClientProvider client={client}>
      <AuthProvider initialState={initialAuthState}>
        {children}
      </AuthProvider>
      <Toaster
        closeButton
        richColors
        position="top-right"
        toastOptions={{duration:4000}}
      />
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
