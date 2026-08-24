import { InlineAlert } from "@/components/feedback/InlineAlert"


export function AuthFormError({message}) {
  return message ? <InlineAlert variant="error">{message}</InlineAlert> : null
}
