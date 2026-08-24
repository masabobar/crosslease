import { toast } from "sonner"
import type { Namespace, TFunction } from "i18next"
import { ApiError } from "@/lib/api"

/**
 * The display string for a failed request.
 *
 * Resolution order, and why each step exists:
 *
 * 1. **`errors.<CODE>` in the caller's namespace** — the curated, translated message.
 * 2. **`errors.<CODE>` in `common`** — resolved by i18next's `fallbackNS`, so the ~35 codes any
 *    endpoint can raise (`PERMISSION_DENIED`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, …) are
 *    keyed once instead of copied into all 13 namespaces. `fallbackNS` is consulted *before*
 *    `defaultValue`, which is what makes a single catalogue reachable from every feature.
 * 3. **`fallback`** — a caller-supplied, already-translated message for the specific action
 *    ("Could not add dealer number {{number}}"). More useful than anything generic, so it
 *    outranks the backend's own prose.
 * 4. **The backend's `detail.message`** — untranslated English, but a real description of what
 *    went wrong. The backend adds codes faster than this repo keys them, and every unkeyed code
 *    used to collapse to "Something went wrong", which told the user nothing. See
 *    `.claude/rules/error-handling-and-logging.md` §2 for the deliberate exception this carves
 *    out of the no-raw-`message` rule in that file's §5.
 * 5. **`errors.generic`** — transport failures and responses with no message at all.
 *
 * A non-`ApiError` throw never reaches step 4: there is no envelope, so there is no message to
 * show.
 */

// `@/lib/api` substitutes this when an error response carries no `detail.message` (api.ts:108).
// It is a placeholder, not backend prose — passing it through at step 4 would re-display the very
// string this helper exists to eliminate, minus the translation.
const SYNTHETIC_MESSAGE = "Something went wrong"

function backendMessage(err: ApiError): string | undefined {
  const message = err.message?.trim()
  if (!message || message === SYNTHETIC_MESSAGE) return undefined
  return message
}

export function resolveApiErrorMessage<N extends Namespace>(
  err: unknown,
  t: TFunction<N>,
  fallback?: string
): string {
  // Every key here is assembled from a wire value at runtime, so it cannot be proven to exist in
  // the resource tree. `t` is narrowed once to its plain call signature rather than cast per call
  // — the same approach `resolveFormMessage` takes in `@/lib/formMessages`.
  const translate = t as unknown as (
    key: string,
    options?: { defaultValue: string }
  ) => string

  const generic = fallback ?? translate("errors.generic")
  if (!(err instanceof ApiError)) return generic

  return translate(`errors.${err.code}`, {
    defaultValue: fallback ?? backendMessage(err) ?? generic,
  })
}

/** Mutation-error toast. The `onError` one-liner for every `useMutation` call site. */
export function showApiError<N extends Namespace>(
  err: unknown,
  t: TFunction<N>,
  fallback?: string
): void {
  toast.error(resolveApiErrorMessage(err, t, fallback))
}
