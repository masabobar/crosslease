import { z } from "zod"

/**
 * Single source of truth for the password policy.
 *
 * Both the Zod validation (`PasswordPolicySchema`) and the live strength meter
 * (`getPasswordRequirements`) are derived from the same length constant and the same
 * regexes, so the meter can never advertise a rule validation does not enforce.
 */
export const MIN_PASSWORD_LENGTH = 8

/**
 * Validation message codes. These are machine identifiers, never shown raw — the form
 * resolves them through the `fieldErrors.<CODE>` i18n lookup (see `FieldError`).
 */
export const PASSWORD_TOO_SHORT = "PASSWORD_TOO_SHORT"
export const PASSWORD_NEEDS_LOWERCASE = "PASSWORD_NEEDS_LOWERCASE"
export const PASSWORD_NEEDS_UPPERCASE = "PASSWORD_NEEDS_UPPERCASE"
export const PASSWORD_NEEDS_NUMBER = "PASSWORD_NEEDS_NUMBER"
export const PASSWORD_NEEDS_SYMBOL = "PASSWORD_NEEDS_SYMBOL"
export const PASSWORDS_DO_NOT_MATCH = "PASSWORDS_DO_NOT_MATCH"

const LOWERCASE_PATTERN = /[a-z]/
const UPPERCASE_PATTERN = /[A-Z]/
const NUMBER_PATTERN = /[0-9]/
const SYMBOL_PATTERN = /[^a-zA-Z0-9]/

export const PasswordPolicySchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT)
  .regex(LOWERCASE_PATTERN, PASSWORD_NEEDS_LOWERCASE)
  .regex(UPPERCASE_PATTERN, PASSWORD_NEEDS_UPPERCASE)
  .regex(NUMBER_PATTERN, PASSWORD_NEEDS_NUMBER)
  .regex(SYMBOL_PATTERN, PASSWORD_NEEDS_SYMBOL)

export type PasswordRequirements = {
  minLength: boolean
  hasLower: boolean
  hasUpper: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export function getPasswordRequirements(
  password: string
): PasswordRequirements {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasLower: LOWERCASE_PATTERN.test(password),
    hasUpper: UPPERCASE_PATTERN.test(password),
    hasNumber: NUMBER_PATTERN.test(password),
    hasSymbol: SYMBOL_PATTERN.test(password),
  }
}

/**
 * Shared shape for both set-password forms — account activation and password reset.
 * The two screens differ only in their copy and endpoint, never in their validation.
 */
export const SetPasswordFormSchema = z
  .object({
    password: PasswordPolicySchema,
    passwordConfirm: z.string(),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ["passwordConfirm"],
  })

export type SetPasswordFormInput = z.infer<typeof SetPasswordFormSchema>
