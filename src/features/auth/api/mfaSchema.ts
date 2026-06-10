import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"

export const MfaEnrollResponseSchema = z.object({
  qr_code: z.string(),
  secret: z.string(),
  mfa_token: z.string(),
})

export type MfaEnrollResponse = z.infer<typeof MfaEnrollResponseSchema>

export const MfaActivateResponseSchema = z.object({
  recovery_codes: z.array(z.string()),
  user: UserResponseSchema,
})

export type MfaActivateResponse = z.infer<typeof MfaActivateResponseSchema>

export const MfaVerifyResponseSchema = z.object({
  user: UserResponseSchema,
  new_recovery_codes: z.array(z.string()).nullable().optional(),
})

export type MfaVerifyResponse = z.infer<typeof MfaVerifyResponseSchema>

export const ResetVerifyResponseSchema = z.object({
  user: UserResponseSchema,
  new_recovery_codes: z.array(z.string()).nullable().optional(),
})

export type ResetVerifyResponse = z.infer<typeof ResetVerifyResponseSchema>
