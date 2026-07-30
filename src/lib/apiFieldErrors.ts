import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError } from "@/lib/api"
import { i18n } from "@/i18n/config"

// The one BE error code that carries per-field detail. Every other code comes from
// create_error_response(), which has no `field` parameter at all — see
// refinext-api/src/app/shared/errors/handlers.py.
export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR"

type ApplyApiFieldErrorsArgs<T extends FieldValues> = {
  error: unknown
  /** The form's registered field names — pass `Object.keys(getValues())`. */
  fields: readonly string[]
  setError: UseFormSetError<T>
  /** Override the attached message. Defaults to `common:validation.rejectedByServer`,
   *  resolved through `i18n.t` directly (same non-React access as `src/main.tsx`'s global
   *  query-error handler). The BE's own text is English prose and is deliberately never
   *  rendered — see .claude/rules/code-review.md §6. */
  message?: string
}

// The BE reports wire names (snake_case). Most forms here use the same names, but a few use
// camelCase, so both spellings are tried before giving up on a field.
function toCamelCase(wireName: string): string {
  return wireName.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

// Nested wire paths arrive dotted ("address.city"); RHF understands that form natively, so
// only the leading segment needs case-matching against the registered field list.
function resolveFieldName(
  wireName: string,
  fields: readonly string[]
): string | null {
  const [head, ...rest] = wireName.split(".")
  const match = [head, toCamelCase(head)].find(candidate =>
    fields.includes(candidate)
  )
  if (!match) return null
  return [match, ...rest].join(".")
}

/**
 * Attaches a VALIDATION_ERROR's per-field detail onto an RHF form.
 *
 * Returns `true` when at least one field error was attached — the caller must then skip its
 * toast. Returns `false` for every other error code, for a validation error carrying no
 * usable field, and for any field the form does not have, so the caller's toast still fires.
 * Silently swallowing an error the user cannot see would be worse than a generic toast.
 *
 * @example
 * onError: err => {
 *   if (applyApiFieldErrors({ error: err, fields: Object.keys(getValues()), setError }))
 *     return
 *   toast.error(...)
 * }
 */
export function applyApiFieldErrors<T extends FieldValues>({
  error,
  fields,
  setError,
  message,
}: ApplyApiFieldErrorsArgs<T>): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.code !== VALIDATION_ERROR_CODE) return false
  if (!error.errors?.length) return false

  const attachedMessage =
    message ?? i18n.t("common:validation.rejectedByServer")

  let attached = false
  for (const entry of error.errors) {
    const name = resolveFieldName(entry.field, fields)
    if (!name) continue
    // `name` was just proved to be one of the form's own registered fields, which is the
    // check TypeScript cannot make from a wire string — so the narrowing to Path<T> is
    // sound. Casting here keeps it to one guarded place instead of 20-odd call sites.
    setError(name as Path<T>, { type: "server", message: attachedMessage })
    attached = true
  }

  return attached
}
