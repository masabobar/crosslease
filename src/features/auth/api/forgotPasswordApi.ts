import { api } from "@/lib/api"
import { ResetPasswordResponseSchema } from "./forgotPasswordSchema"
import type { ResetPasswordResponse } from "./forgotPasswordSchema"

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password/forgot", { email })
}

export async function validateResetToken(token: string): Promise<void> {
  await api.get("/auth/password/validate-token", { params: { token } })
}

export async function resetPassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<ResetPasswordResponse> {
  const data = await api.post("/auth/password/reset", {
    token,
    password,
    password_confirm: passwordConfirm,
  })
  return ResetPasswordResponseSchema.parse(data)
}
