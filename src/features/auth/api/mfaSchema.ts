import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"

export const TOTP_CODE_LENGTH = 6
export const RECOVERY_CODE_LENGTH = 20

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

export const ResetVerifyResponseSchema = MfaVerifyResponseSchema

export type ResetVerifyResponse = MfaVerifyResponse
