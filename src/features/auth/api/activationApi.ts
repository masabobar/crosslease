import { api } from "@/lib/api"
import { SetPasswordResponseSchema } from "./activationSchema"
import type { SetPasswordResponse } from "./activationSchema"

export async function validateActivationToken(token: string): Promise<void> {
  await api.get(
    `/auth/invite/validate-token?token=${encodeURIComponent(token)}`
  )
}

export async function activateSetPassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<SetPasswordResponse> {
  const data = await api.post("/auth/invite/set-password", {
    token,
    password,
    password_confirm: passwordConfirm,
  })
  return SetPasswordResponseSchema.parse(data)
}
