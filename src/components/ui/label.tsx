import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

type LabelProps = ComponentProps<"label"> & {
  error?: boolean
}

function Label({ className, error, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium",
        error ? "text-destructive" : "text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Label }
