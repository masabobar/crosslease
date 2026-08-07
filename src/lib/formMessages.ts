import type { Namespace, TFunction } from "i18next"
import { i18n } from "@/i18n/config"

/**
 * Resolves a React Hook Form error message for display.
 *
 * Zod schemas in this codebase carry a bare *code* (`"required"`, `"validToBeforeValidFrom"`)
 * rather than prose, so the code is translated — from `common:validation.*` when it is one of the
 * shared codes, otherwise from the form's own `<prefix>.<code>` key.
 *
 * Two message sources are **not** codes and must survive untouched:
 *
 * 1. Zod's own English text for a rule declared without a message (`.max(200)` →
 *    `"Too big: expected string to have <=200 characters"`).
 * 2. The already-translated string `applyApiFieldErrors` attaches for a server
 *    `VALIDATION_ERROR` (`common:validation.rejectedByServer`).
 *
 * Both are returned verbatim via `defaultValue`. Feeding either back through `t()` as a key
 * renders a mangled key path on screen — i18next splits the text on its own `:` namespace and
 * `.` key separators, so `"Too big: expected …"` surfaces to the user as
 * `" expected string to have <=200 characters"`. Prefer giving the rule a message code and a
 * translation over relying on the verbatim fallback.
 */
// i18next's typed `t` only accepts keys it can prove exist in the resource tree. Every key here
// is assembled at runtime from a Zod message code, so `t` is narrowed once to its plain call
// signature rather than casting at each of the three lookups.
type Translate = (
  key: string,
  options?: { defaultValue: string }
) => string | undefined

export function resolveFormMessage<N extends Namespace>(
  message: string | undefined,
  t: TFunction<N>,
  errorKeyPrefix: string
): string | undefined {
  if (!message) return undefined

  const translate = t as unknown as Translate

  const commonKey = `common:validation.${message}`
  if (i18n.exists(commonKey)) return translate(commonKey)

  return translate(`${errorKeyPrefix}.${message}`, { defaultValue: message })
}
