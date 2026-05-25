import { api } from "@/lib/api"

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email })
}

export async function validateResetToken(token: string): Promise<void> {
  await api.get("/auth/validate-reset-token", { params: { token } })
}

export async function resetPassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<void> {
  await api.post("/auth/reset-password", {
    token,
    password,
    password_confirm: passwordConfirm,
  })
}
