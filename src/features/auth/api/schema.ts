import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"

export const LoginInputSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
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
