import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FilterCheckboxRowProps = {
  checked: boolean
  onClick: () => void
  children: ReactNode
  "data-testid"?: string
}

function FilterCheckboxRow({
  checked,
  onClick,
  children,
  "data-testid": testId,
}: FilterCheckboxRowProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      data-testid={testId}
      onClick={onClick}
      className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
    >
      <span
        className={cn(
          "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
          checked ? "bg-primary border-primary" : "border-border"
        )}
      >
        {checked && <Check size={10} className="text-white" />}
      </span>
      {children}
    </Button>
  )
}

export { FilterCheckboxRow }
