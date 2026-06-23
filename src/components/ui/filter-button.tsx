import { Filter, Calendar } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export const FILTER_TRIGGER_CLASS =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted data-[popup-open]:bg-muted transition-colors whitespace-nowrap"

type FilterButtonProps = {
  label: string
  count?: number
  icon?: "filter" | "calendar"
  contentClassName?: string
  align?: "start" | "center" | "end"
  "data-testid"?: string
  children: React.ReactNode
}

function FilterButton({
  label,
  count = 0,
  icon = "filter",
  contentClassName,
  align = "start",
  "data-testid": testId,
  children,
}: FilterButtonProps) {
  return (
    <Popover>
      <PopoverTrigger data-testid={testId} className={FILTER_TRIGGER_CLASS}>
        {icon === "calendar" ? (
          <Calendar size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <Filter size={16} className="shrink-0 text-muted-foreground" />
        )}
        {label}
        {count > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align={align}
        className={cn("p-0 py-1", contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export { FilterButton }
