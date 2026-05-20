import { cn } from "@/lib/utils"
import type { ComponentProps, ReactNode } from "react"

type InputProps = ComponentProps<"input"> & {
  error?: boolean
  startIcon?: ReactNode
  endAction?: ReactNode
}

function Input({
  className,
  error,
  startIcon,
  endAction,
  ...props
}: InputProps) {
  const inputClass = cn(
    "w-full bg-background border text-foreground rounded-lg outline-none transition-colors placeholder:text-muted-foreground",
    "focus-visible:ring-2 focus-visible:ring-primary/30",
    error
      ? "border-destructive focus-visible:border-destructive"
      : "border-border focus-visible:border-primary",
    startIcon ? "pl-9" : "pl-4",
    endAction ? "pr-10" : "pr-4",
    "py-2.5",
    className
  )

  if (!startIcon && !endAction) {
    return <input className={inputClass} {...props} />
  }

  return (
    <div className="relative">
      {startIcon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {startIcon}
        </span>
      )}
      <input className={inputClass} {...props} />
      {endAction && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {endAction}
        </span>
      )}
    </div>
  )
}

export { Input }
