import { z } from "zod"

export const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginInputSchema>

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>
