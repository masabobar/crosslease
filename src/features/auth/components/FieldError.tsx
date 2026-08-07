import { useTranslation } from "react-i18next"
import { MIN_PASSWORD_LENGTH } from "../api/passwordPolicy"

type FieldErrorProps = {
  /** A validation message code from the form schema — never display prose. */
  code: string | undefined
  testId: string
}

/**
 * Resolves a schema message code through the dynamic `fieldErrors.<CODE>` lookup, the same
 * idiom used for backend `errors.<CODE>` codes. Adding a validation rule therefore only
 * needs a new i18n key, never a change here.
 */
export function FieldError({ code, testId }: FieldErrorProps) {
  const { t } = useTranslation("auth")

  if (!code) return null

  return (
    <p data-testid={testId} className="mt-1.5 text-sm text-destructive">
      {t(`fieldErrors.${code}`, {
        defaultValue: t("fieldErrors.generic"),
        minLength: MIN_PASSWORD_LENGTH,
      })}
    </p>
  )
}
