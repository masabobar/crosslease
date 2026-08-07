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

// Schemes that are safe to hand to an `src` / `href` attribute. `javascript:` executes on
// click and `data:` can carry markup, so a URL that came from user-editable storage — an
// uploaded avatar path, a partner-supplied link — is dropped unless it is one of these.
const SAFE_URL_SCHEMES = ["http:", "https:"]

/**
 * Returns the URL only when it is safe to render, otherwise null so the caller can fall
 * back to its placeholder. Relative paths are allowed: they resolve against our own origin.
 */
export function safeImageUrl(
  url: string | null | undefined
): string | null | undefined {
  if (!url) return url
  if (url.startsWith("/")) return url
  try {
    return SAFE_URL_SCHEMES.includes(new URL(url).protocol) ? url : null
  } catch {
    return null
  }
}

// Editable comboboxes (BaseUI ComboboxInput) don't clear their displayed text
// on focus — without this, typing to change an existing selection appends to
// it instead of replacing it, producing a query that matches nothing.
export function selectOnFocus(event: FocusEvent<HTMLInputElement>): void {
  event.currentTarget.select()
}
