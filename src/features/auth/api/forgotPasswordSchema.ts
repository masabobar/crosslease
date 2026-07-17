import { z } from "zod"
import { PasswordPolicySchema } from "./passwordPolicy"

export const ResetPasswordResponseSchema = z.object({
  mfa_required: z.boolean(),
  mfa_token: z.string().nullable().optional(),
})

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>

export const ForgotPasswordInputSchema = z.object({
  email: z.string().min(1).email(),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>

export const PASSWORDS_DO_NOT_MATCH = "PASSWORDS_DO_NOT_MATCH"

export const ResetPasswordInputSchema = z
  .object({
    password: PasswordPolicySchema,
    password_confirm: z.string(),
  })
  .refine(data => data.password === data.password_confirm, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ["password_confirm"],
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>

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
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  }
}
