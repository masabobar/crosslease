import * as React from "react"
import { cn } from "@/lib/utils"

type LabelProps = React.ComponentProps<"label"> & {
  error?: boolean
}

function Label({ className, error, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-sm leading-5 font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        error ? "text-destructive" : "text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Label }
