import { api } from "@/lib/api"
import {
  MfaEnrollResponseSchema,
  MfaActivateResponseSchema,
  MfaVerifyResponseSchema,
  ResetVerifyResponseSchema,
} from "./mfaSchema"
import type {
  MfaEnrollResponse,
  MfaActivateResponse,
  MfaVerifyResponse,
  ResetVerifyResponse,
} from "./mfaSchema"

export async function mfaEnroll(mfaToken: string): Promise<MfaEnrollResponse> {
  const data = await api.post("/auth/mfa/enroll", { mfa_token: mfaToken })
  return MfaEnrollResponseSchema.parse(data)
}

export async function mfaActivate(
  mfaToken: string,
  code: string
): Promise<MfaActivateResponse> {
  const data = await api.post("/auth/mfa/activate", {
    mfa_token: mfaToken,
    code,
  })
  return MfaActivateResponseSchema.parse(data)
}

export async function mfaVerify(
  mfaToken: string,
  code: string
): Promise<MfaVerifyResponse> {
  const data = await api.post("/auth/mfa/verify", { mfa_token: mfaToken, code })
  return MfaVerifyResponseSchema.parse(data)
}

export async function resetPasswordVerify(
  mfaToken: string,
  code: string
): Promise<ResetVerifyResponse> {
  const data = await api.post("/auth/password/reset/verify", {
    mfa_token: mfaToken,
    code,
  })
  return ResetVerifyResponseSchema.parse(data)
}
