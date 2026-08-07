import { z } from "zod"

export const SetPasswordResponseSchema = z.object({
  mfa_enrollment_required: z.boolean(),
  mfa_token: z.string().nullable().optional(),
})

export type SetPasswordResponse = z.infer<typeof SetPasswordResponseSchema>

export function decodeTokenEmail(token: string): string | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    return typeof payload.email === "string" ? payload.email : null
  } catch {
    return null
  }
}
