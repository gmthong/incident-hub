import { format, isValid, parseISO } from "date-fns"


export function DateTimeDisplay({value, formatPattern="PPp", fallback="—"}) {
  if (!value) {
    return <span>{fallback}</span>
  }

  const date = value instanceof Date ? value : parseISO(value)
  if (!isValid(date)) {
    return <span>{fallback}</span>
  }

  return (
    <time dateTime={date.toISOString()} title={date.toLocaleString()}>
      {format(date, formatPattern)}
    </time>
  )
}
