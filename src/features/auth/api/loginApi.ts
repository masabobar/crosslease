// TODO: Verify endpoint path, request body shape, and response schema once
// refinext-api auth routes are implemented.
import { api } from "@/lib/api"
import { LoginResponseSchema } from "./schema"
import type { LoginInput, LoginResponse } from "./schema"

export async function login(credentials: LoginInput): Promise<LoginResponse> {
  const data = await api.post("/auth/login", credentials)
  return LoginResponseSchema.parse(data)
}
