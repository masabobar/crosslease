import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FocusEvent } from "react"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Editable comboboxes (BaseUI ComboboxInput) don't clear their displayed text
// on focus — without this, typing to change an existing selection appends to
// it instead of replacing it, producing a query that matches nothing.
export function selectOnFocus(event: FocusEvent<HTMLInputElement>): void {
  event.currentTarget.select()
}
