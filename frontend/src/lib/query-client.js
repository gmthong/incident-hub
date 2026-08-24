import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/errors"


function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }

  return failureCount < 1
}


export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions:{
      queries:{
        refetchOnWindowFocus:false,
        retry:shouldRetry,
        staleTime:30_000,
      },
      mutations:{
        retry:false,
      },
    },
  })
}
