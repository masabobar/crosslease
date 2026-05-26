import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"

export const LoginInputSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginInputSchema>

export const MfaRequiredResponseSchema = z.object({
  status: z.literal("MFA_REQUIRED"),
  verification_token: z.string(),
  expires_in: z.number(),
})

export type MfaRequiredResponse = z.infer<typeof MfaRequiredResponseSchema>

export const VerifyOtpInputSchema = z.object({
  verification_token: z.string(),
  code: z.string().length(6),
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
