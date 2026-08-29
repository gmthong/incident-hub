import { useState } from "react"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { cn } from "@/utils/cn"


export function ErrorState({title, description, action, actionLabel="Try again", onRetry, className}) {
  const [isRetrying, setIsRetrying] = useState(false)

  async function retry() {
    setIsRetrying(true)
    try {
      await onRetry?.()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <section aria-live="assertive" className={cn("w-full max-w-xl rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8", className)} role="alert">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-700">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
      {!action && onRetry ? <Button className="mt-5" isLoading={isRetrying} loadingLabel="Retrying" onClick={retry}>{actionLabel}</Button> : null}
    </section>
  )
}
