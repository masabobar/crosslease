import { api } from "@/lib/api"

export async function validateActivationToken(token: string): Promise<void> {
  await api.get(`/auth/validate-token?token=${encodeURIComponent(token)}`)
}

export async function activateSetPassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<void> {
  await api.post("/auth/set-password", {
    token,
    password,
    password_confirm: passwordConfirm,
  })
}
