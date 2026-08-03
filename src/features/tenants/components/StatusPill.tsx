import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type StatusPillProps = {
  colorClassName: string
  dotClassName?: string
  shrink?: boolean
  className?: string
  children: ReactNode
}

// Shared colored-pill badge shape used by all tenant status/state badges.
// Presence of `dotClassName` determines the padding scheme: badges with a
// leading dot indicator use gap-1/px-2, badges without one use the
// fixed-height px-1.5 layout.
function StatusPill({
  colorClassName,
  dotClassName,
  shrink,
  className,
  children,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full text-xs font-medium",
        dotClassName ? "gap-1 px-2 py-0.5" : "h-[18px] px-1.5 py-0.5",
        shrink && "shrink-0",
        colorClassName,
        className
      )}
    >
      {dotClassName && (
        <span className={cn("size-1.5 rounded-full shrink-0", dotClassName)} />
      )}
      {children}
    </span>
  )
}

export { StatusPill }
