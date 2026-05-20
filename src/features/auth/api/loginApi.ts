// TODO: wire up once API endpoints are available
// POST /auth/login — body: LoginInput, response: LoginResponse
import type { LoginInput, LoginResponse } from "./schema"

export async function login(_credentials: LoginInput): Promise<LoginResponse> {
  throw new Error("Not implemented")
}
