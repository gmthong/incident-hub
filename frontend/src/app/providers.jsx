import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"

import { createAppQueryClient } from "@/lib/query-client"


export function AppProviders({children, queryClient, showDevtools=import.meta.env.DEV}) {
  const [client] = useState(() => queryClient ?? createAppQueryClient())

  return (
    <QueryClientProvider client={client}>
      {children}
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
