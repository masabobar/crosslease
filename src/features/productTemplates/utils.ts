import { toast } from "sonner"
import type { TFunction } from "i18next"
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

// Shared mutation-error toast for this feature: any BE error code translates via
// errors.<CODE>, falling back to the generic message for unknown codes and non-ApiError
// throws (network down, timeout) — see .claude/rules/error-handling-and-logging.md §2.
export function showApiError(
  err: unknown,
  t: TFunction<"productTemplates">
): void {
  toast.error(
    err instanceof ApiError
      ? t(`errors.${err.code}` as "errors.generic", {
          defaultValue: t("errors.generic"),
        })
      : t("errors.generic")
  )
}
