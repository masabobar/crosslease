import { z } from "zod"
import { UserResponseSchema } from "@/features/users/api/schema"

export const TOTP_CODE_LENGTH = 6
export const RECOVERY_CODE_LENGTH = 20

const TOTP_CODE_PATTERN = /^\d+$/
const RECOVERY_CODE_PATTERN = /^[0-9a-f]+$/

/**
 * Recovery codes are lowercase hex on the wire, but a mobile keyboard auto-capitalizes and
 * some mail clients upper-case them on copy. Without folding the case here the submit button
 * stays disabled with nothing on screen to explain why.
 */
export function normalizeMfaCodeInput(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * The MFA challenge and the password-reset challenge share one input that accepts either
 * a 6-digit TOTP code or a 20-character hex recovery code, so both screens gate their
 * submit button on the same shape check.
 */
export function isAcceptedMfaCode(code: string): boolean {
  const isTotpCode =
    code.length === TOTP_CODE_LENGTH && TOTP_CODE_PATTERN.test(code)
  const isRecoveryCode =
    code.length === RECOVERY_CODE_LENGTH && RECOVERY_CODE_PATTERN.test(code)
  return isTotpCode || isRecoveryCode
}

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
