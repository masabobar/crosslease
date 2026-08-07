import { z } from "zod"

export const ResetPasswordResponseSchema = z.object({
  mfa_required: z.boolean(),
  mfa_token: z.string().nullable().optional(),
})

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>

export const EMAIL_REQUIRED = "EMAIL_REQUIRED"
export const EMAIL_INVALID = "EMAIL_INVALID"

export const ForgotPasswordInputSchema = z.object({
  email: z.string().min(1, EMAIL_REQUIRED).email(EMAIL_INVALID),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>
