import { ApiError } from "@/lib/api"

// These two codes both mean "render Not-Found, not a generic error" — the BE returns
// the same 404 shape for a genuinely missing template and a cross-tenant one.
const PRODUCT_TEMPLATE_NOT_FOUND_CODES = new Set([
  "PRODUCT_TEMPLATE_NOT_FOUND",
  "PRODUCT_TEMPLATE_VERSION_NOT_FOUND",
])

export function isProductTemplateNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    PRODUCT_TEMPLATE_NOT_FOUND_CODES.has(error.code)
  )
}

// The BE enforces module activation via two different code paths that emit two different
// codes for the same condition: the shared permissions dependency (list/read endpoints)
// returns "MODULE_NOT_ACTIVE", while the create endpoint's own domain exception returns
// "BPT_MODULE_NOT_ACTIVE" — this checks for either so the FE surfaces the same message
// regardless of which endpoint the tenant's inactive module was hit on.
const MODULE_NOT_ACTIVE_CODES = new Set([
  "MODULE_NOT_ACTIVE",
  "BPT_MODULE_NOT_ACTIVE",
])

export function isModuleNotActiveError(error: unknown): boolean {
  return error instanceof ApiError && MODULE_NOT_ACTIVE_CODES.has(error.code)
}

// Resolves a Zod form-validation message code to its display string. Wizard step schemas
// use short message codes ("required", "atLeastOne", ...) instead of literal text so the
// translation can be resolved per step; "required" always maps to the shared common
// validation copy, other codes are looked up in the caller-supplied map (already resolved
// via t() at the call site, since t()'s key type is narrowed per i18n namespace). A code
// with no entry in the map is returned as-is.
export function resolveFieldErrorMessage(
  msg: string | undefined,
  requiredMessage: string,
  errorMessages: Record<string, string> = {}
): string | undefined {
  if (!msg) return undefined
  if (msg === "required") return requiredMessage
  return errorMessages[msg] ?? msg
}

/**
 * Orders the BE's dotted version strings ("0.1", "1.0", "2") by segment so the caller can
 * pick the highest without relying on the list's arrival order — which is not part of the
 * contract. Segment-wise rather than `Number(v)`, because parsing "1.10" as a decimal ranks
 * it below "1.9".
 */
export function compareVersionNumbers(a: string, b: string): number {
  const aParts = a.split(".").map(Number)
  const bParts = b.split(".").map(Number)
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** The highest version number in the list, or null when there are none. */
export function latestVersionNumber(
  versions: readonly { version_number: string }[]
): string | null {
  return versions.length
    ? versions.reduce((latest, v) =>
        compareVersionNumbers(v.version_number, latest.version_number) > 0
          ? v
          : latest
      ).version_number
    : null
}
