import { forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { IconButton } from "@/components/ui/IconButton"
import { Input } from "@/components/ui/Input"
import { cn } from "@/utils/cn"


export const PasswordInput = forwardRef(function PasswordInput({className, ...props}, ref) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        className={cn("pr-11", className)}
        ref={ref}
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <IconButton
        className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-slate-500 hover:bg-slate-100"
        label={isVisible ? "Hide password" : "Show password"}
        onClick={() => setIsVisible((value) => !value)}
        variant="ghost"
      >
        {isVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </IconButton>
    </div>
  )
})
