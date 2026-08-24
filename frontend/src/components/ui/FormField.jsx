import { cloneElement, isValidElement } from "react"

import { cn } from "@/utils/cn"


export function FormField({
  children,
  className,
  currentLength,
  description,
  error,
  id,
  label,
  maxLength,
  required=false,
}) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
      "aria-describedby":describedBy,
      "aria-invalid":Boolean(error),
      id,
    })
    : children

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end justify-between gap-4">
        <label className="text-sm font-medium text-slate-800" htmlFor={id}>
          {label}
          {required ? <span aria-hidden="true" className="ml-1 text-red-600">*</span> : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
        {typeof maxLength === "number" ? (
          <span className="text-xs tabular-nums text-slate-500">
            {currentLength ?? 0}/{maxLength}
          </span>
        ) : null}
      </div>
      {control}
      {description ? <p className="text-xs leading-5 text-slate-500" id={descriptionId}>{description}</p> : null}
      {error ? <p className="text-xs font-medium text-red-700" id={errorId} role="alert">{error}</p> : null}
    </div>
  )
}
