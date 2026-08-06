import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FocusEvent } from "react"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// `setValueAs` transform for optional number inputs. react-hook-form's own
// `valueAsNumber` turns an emptied input into NaN, not undefined, which fails an
// `.optional()` zod field instead of passing it — so blank has to become undefined
// here. Required numeric fields keep `valueAsNumber` and use `requiredNumber()` from
// @/lib/zodHelpers to translate the NaN case.
export function optionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value)
}

// Editable comboboxes (BaseUI ComboboxInput) don't clear their displayed text
// on focus — without this, typing to change an existing selection appends to
// it instead of replacing it, producing a query that matches nothing.
export function selectOnFocus(event: FocusEvent<HTMLInputElement>): void {
  event.currentTarget.select()
}
