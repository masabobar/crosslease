import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

type FilterCheckboxOptionProps = {
  checked: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  "data-testid"?: string
}

// Option row inside a FilterButton popover. The Checkbox is presentational only —
// the wrapping Button owns the click target and the accessible name, so the
// Checkbox is removed from the tab order and the a11y tree to avoid announcing
// two controls for one option.
function FilterCheckboxOption({
  checked,
  onClick,
  disabled,
  children,
  "data-testid": testId,
}: FilterCheckboxOptionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
      className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal disabled:opacity-50"
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0"
      />
      {children}
    </Button>
  )
}

export { FilterCheckboxOption }
