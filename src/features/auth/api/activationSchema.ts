import { z } from "zod"
import { PasswordPolicySchema } from "./passwordPolicy"

export { getPasswordRequirements } from "./forgotPasswordSchema"

export const SetPasswordResponseSchema = z.object({
  mfa_enrollment_required: z.boolean(),
  mfa_token: z.string().nullable().optional(),
})

export type SetPasswordResponse = z.infer<typeof SetPasswordResponseSchema>

export const ActivateAccountInputSchema = z
  .object({
    password: PasswordPolicySchema,
    passwordConfirm: z.string(),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: "passwords_mismatch",
    path: ["passwordConfirm"],
  })

export type ActivateAccountInput = z.infer<typeof ActivateAccountInputSchema>

export function decodeTokenEmail(token: string): string | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    return typeof payload.email === "string" ? payload.email : null
  } catch {
    return null
  }
}
