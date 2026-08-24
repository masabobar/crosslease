import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { FieldValues, UseFormSetError } from "react-hook-form"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

type FormErrorTarget<T extends FieldValues> = {
  /** Pass the form's `getValues` — used to read the registered field names. */
  getValues: () => T
  setError: UseFormSetError<T>
}

/**
 * The mutation `onError` handler every tenant governance form uses.
 *
 * Implements `.claude/rules/api-error-display.md` §2 + §2.1 exactly: a
 * VALIDATION_ERROR's per-field detail is attached to the form first, and any
 * other code — plus unmappable validation errors and non-ApiError throws —
 * surfaces as a toast resolved by error code with a generic fallback. There is
 * no per-code switch, so a new BE code needs only a new `errors.<CODE>` key.
 */
export function useTenantFormErrorHandler<T extends FieldValues>({
  getValues,
  setError,
}: FormErrorTarget<T>): (error: unknown) => void {
  const { t } = useTranslation("tenants")

  return function handleError(error: unknown) {
    if (
      applyApiFieldErrors({
        error,
        fields: Object.keys(getValues()),
        setError,
      })
    )
      return

    toast.error(resolveApiErrorMessage(error, t))
  }
}
