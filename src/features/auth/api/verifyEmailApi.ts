import { api } from "@/lib/api"

export async function verifyEmailChange(token: string): Promise<void> {
  await api.post(`/auth/verify-email-change?token=${encodeURIComponent(token)}`)
}
