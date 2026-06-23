import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type FilterPillProps = {
  label: string
  onRemove: () => void
  "data-testid"?: string
}

function FilterPill({
  label,
  onRemove,
  "data-testid": testId,
}: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0">
      {label}
      <Button
        type="button"
        variant="ghost"
        data-testid={testId}
        onClick={onRemove}
        className="h-auto p-0 ml-0.5 opacity-80 hover:opacity-100 hover:bg-transparent transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X size={11} strokeWidth={2.5} />
      </Button>
    </span>
  )
}

export { FilterPill }
