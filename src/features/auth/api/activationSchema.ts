import { z } from "zod"

export { getPasswordRequirements } from "./forgotPasswordSchema"

export const ActivateAccountInputSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/),
    password_confirm: z.string(),
  })
  .refine(data => data.password === data.password_confirm, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["password_confirm"],
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
