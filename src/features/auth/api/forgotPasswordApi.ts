import { api } from "@/lib/api"

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/users/forgot-password", { email })
}

export async function validateResetToken(token: string): Promise<void> {
  await api.get("/users/validate-reset-token", { params: { token } })
}

export async function resetPassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<void> {
  await api.post("/users/reset-password", {
    token,
    password,
    password_confirm: passwordConfirm,
  })
}
