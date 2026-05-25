import { Select } from "@base-ui/react/select"
import { ChevronDown, Check } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  id?: string
  "data-testid"?: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: boolean
  disabled?: boolean
  renderTriggerContent?: (selected: SelectOption | undefined) => ReactNode
  renderOption?: (option: SelectOption) => ReactNode
}

function SelectField({
  id,
  "data-testid": testId,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  disabled,
  renderTriggerContent,
  renderOption,
}: SelectFieldProps) {
  const selected = options.find(o => o.value === value)

  return (
    <Select.Root
      value={value || null}
      onValueChange={v => onValueChange(v ?? "")}
      disabled={disabled}
    >
      <Select.Trigger
        id={id}
        data-testid={testId}
        className={cn(
          "w-full bg-background border text-foreground rounded-lg outline-none transition-colors",
          "flex items-center justify-between",
          "px-4 py-2.5",
          "focus-visible:ring-2 focus-visible:ring-primary/30",
          error
            ? "border-destructive focus-visible:border-destructive"
            : "border-border focus-visible:border-primary",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <Select.Value
          placeholder={
            <span className="text-muted-foreground">{placeholder}</span>
          }
        >
          {renderTriggerContent
            ? renderTriggerContent(selected)
            : selected?.label}
        </Select.Value>
        <Select.Icon className="text-muted-foreground shrink-0 ml-2">
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={4} className="z-[60]">
          <Select.Popup
            className={cn(
              "bg-white border border-border rounded-lg shadow-lg",
              "min-w-[var(--anchor-width)] overflow-hidden",
              "py-1",
              "transition-all duration-150",
              "data-[open]:opacity-100 data-[open]:scale-100",
              "data-[closed]:opacity-0 data-[closed]:scale-95",
              "data-[starting-style]:opacity-0 data-[starting-style]:scale-95"
            )}
          >
            {options.map(option => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "flex items-center justify-between gap-2",
                  "px-3 py-2 cursor-pointer",
                  "text-sm text-foreground",
                  "hover:bg-muted outline-none",
                  "data-[highlighted]:bg-muted",
                  "data-[selected]:font-medium"
                )}
              >
                <Select.ItemText>
                  {renderOption ? renderOption(option) : option.label}
                </Select.ItemText>
                <Select.ItemIndicator className="text-primary shrink-0">
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

export type { SelectOption }
export { SelectField }
