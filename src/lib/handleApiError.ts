import { ApiError } from "@/lib/api"
import type { ToastVariant } from "@/store/toastStore"

type ShowToast = (payload: {
  variant: ToastVariant
  title: string
  message: string
}) => void

// Using `never` as the key type makes every i18next TFunction assignable here.
// TFunction<"ns"> only accepts specific keys (narrow union), which makes it
// incompatible with `(key: string) => string` via contravariance. But `never`
// is a subtype of every type, so the narrowness check passes in both directions.
// We cast to string inside the function body where we need to call it dynamically.
type TFn = (key: never, opts?: Record<string, unknown>) => string

/**
 * Translates an API error into a user-visible toast.
 *
 * Extracts err.code when the error is an ApiError, then looks up
 * `errors.<code>` in the active i18n namespace. Falls back to
 * `fallbackKey` (default "errors.generic") for unknown codes or
 * non-ApiError throws.
 */
export function handleApiError(
  err: unknown,
  showToast: ShowToast,
  t: TFn,
  title: string,
  opts?: {
    fallbackKey?: string
    variant?: ToastVariant
  }
): void {
  const fallbackKey = opts?.fallbackKey ?? "errors.generic"
  const variant = opts?.variant ?? "warning"
  const translate = t as unknown as (
    key: string,
    opts?: Record<string, unknown>
  ) => string
  const message =
    err instanceof ApiError
      ? translate(`errors.${err.code}`, {
          defaultValue: translate(fallbackKey),
        })
      : translate(fallbackKey)
  showToast({ variant, title, message })
}
