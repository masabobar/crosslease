import { api } from "@/lib/api"

export async function validateActivationToken(token: string): Promise<void> {
  await api.get(`/users/validate-token?token=${encodeURIComponent(token)}`)
}

export async function activateSetPassword(
  token: string,
  password: string
): Promise<void> {
  await api.post("/users/set-password", {
    token,
    password,
    password_confirm: password,
  })
}
