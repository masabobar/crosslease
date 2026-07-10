import * as React from "react"
import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  id?: string
  "data-testid"?: string
  className?: string
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
}

function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  error,
  disabled,
  minDate,
  maxDate,
  id,
  "data-testid": testId,
  className,
  captionLayout = "label",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseISO(value) : undefined

  const disabledDays = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]

  return (
    <Popover open={open} onOpenChange={(isOpen: boolean) => setOpen(isOpen)}>
      <PopoverTrigger
        id={id}
        data-testid={testId}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-[36px] w-full items-center justify-between rounded-[12px] border border-input bg-background px-[10px] text-sm text-foreground outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span>
          {value ? format(parseISO(value), "MMM d, yyyy") : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout={captionLayout}
          selected={selected}
          onSelect={date => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }
          }}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
