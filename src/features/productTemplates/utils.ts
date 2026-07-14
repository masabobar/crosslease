import { ApiError } from "@/lib/api"

// These three codes all mean "render Not-Found, not a generic error" — the BE returns
// the same 404 shape for a genuinely missing template, a cross-tenant one, and one behind
// an inactive module, by design (existence non-disclosure), so the FE treats them alike.
const PRODUCT_TEMPLATE_NOT_FOUND_CODES = new Set([
  "PRODUCT_TEMPLATE_NOT_FOUND",
  "PRODUCT_TEMPLATE_VERSION_NOT_FOUND",
  "BPT_MODULE_NOT_ACTIVE",
])

export function isProductTemplateNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    PRODUCT_TEMPLATE_NOT_FOUND_CODES.has(error.code)
  )
}
