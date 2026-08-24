import { forwardRef } from "react"

import { Button } from "@/components/ui/Button"


export const IconButton = forwardRef(function IconButton({label, children, ...props}, ref) {
  return (
    <Button aria-label={label} ref={ref} size="icon" {...props}>
      {children}
    </Button>
  )
})
