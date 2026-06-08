import type { APIRequestContext } from "../fixtures/test"

// Retrieves the current valid OTP for `email` from the backend test endpoint.
// Requires E2E_API_BASE_URL to point at the API root (e.g. https://api.refinext-dev.projects.holycode.com).
export async function getTestOtp(
  request: APIRequestContext,
  email: string
): Promise<string> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const response = await request.get(`${apiBase}/internal/test/otp`, {
    params: { email },
  })
  if (!response.ok()) {
    throw new Error(
      `GET /internal/test/otp failed: ${response.status()} ${response.statusText()}`
    )
  }
  const body = (await response.json()) as { code: string; expires_at: string }
  return body.code
}
