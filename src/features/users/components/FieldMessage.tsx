import { useTranslation } from "react-i18next"
import { resolveFieldMessage } from "@/features/users/utils"

type FieldMessageProps = {
  /**
   * The RHF field error. Typed as the structural minimum rather than `FieldError` so it
   * accepts the error objects of union-typed forms (UserActionModal) without a cast.
   */
  error?: { message?: string }
  "data-testid"?: string
}

/**
 * Validation message for a single form field.
 *
 * Every field that can carry an error needs one of these. `Input`, `SelectField` and
 * `DatePicker` take a boolean `error` prop that only sets `aria-invalid` — they render no
 * text of their own, so a field without this component shows a red outline and nothing
 * else. That matters most for a server `VALIDATION_ERROR`: `applyApiFieldErrors` attaches
 * the message and its caller then *skips the toast*, so this is the only thing left to
 * explain the rejected submit.
 */
export function FieldMessage({
  error,
  "data-testid": testId,
}: FieldMessageProps) {
  const { t: tCommon } = useTranslation("common")
  const message = resolveFieldMessage(error?.message, tCommon)

  if (!message) return null

  // A block-level <span>, not a <p>: the identity cards render this inside DetailRow's
  // <span>, and <p> is not valid phrasing content there. `block` keeps it on its own line.
  return (
    <span className="mt-1 block text-sm text-destructive" data-testid={testId}>
      {message}
    </span>
  )
}
