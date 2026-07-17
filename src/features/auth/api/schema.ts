import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"
import { TOTP_CODE_LENGTH } from "./mfaSchema"

export const REQUIRED_FIELD_MESSAGE = "required"

export const LoginInputSchema = z.object({
  email: z
    .string()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .email(REQUIRED_FIELD_MESSAGE),
  password: z.string().min(1, REQUIRED_FIELD_MESSAGE),
})

export type LoginInput = z.infer<typeof LoginInputSchema>

export const LoginStepResponseSchema = z.object({
  next_step: z.enum(["otp", "mfa", "mfa_setup", "session"]),
  token: z.string().nullable().optional(),
  expires_in: z.number().nullable().optional(),
})

export type LoginStepResponse = z.infer<typeof LoginStepResponseSchema>

export const VerifyOtpInputSchema = z.object({
  verification_token: z.string(),
  code: z.string().length(TOTP_CODE_LENGTH),
})

export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>

export const ResendOtpInputSchema = z.object({
  verification_token: z.string(),
})

export type ResendOtpInput = z.infer<typeof ResendOtpInputSchema>

export const LoginResponseSchema = z.object({
  user: UserResponseSchema,
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>
