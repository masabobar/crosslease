import { z } from "zod"

export const ForgotPasswordInputSchema = z.object({
  email: z.string().min(1).email(),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>

export const ResetPasswordInputSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
})

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>

export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  }
}
