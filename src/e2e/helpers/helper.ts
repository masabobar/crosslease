import type { APIRequestContext, Page } from "../fixtures/test"

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

// Creates an authenticated test session for `email` via POST /internal/test/session,
// navigates to `landingUrl`, and writes isAuthenticated to localStorage so Zustand's
// persisted auth flag reflects the session — mirroring the auth.setup.ts pattern.
export async function createTestSession(
  page: Page,
  email: string,
  landingUrl: string = "/"
): Promise<void> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const response = await page.request.post(`${apiBase}/internal/test/session`, {
    data: { email },
  })
  if (!response.ok()) {
    throw new Error(
      `POST /internal/test/session failed: ${response.status()} ${response.statusText()}`
    )
  }
  // Pre-seed the Zustand auth flag before React mounts so ProtectedLayout
  // does not redirect to /login before the component tree has rendered.
  await page.addInitScript(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
    )
  })
  await page.goto(landingUrl)
  await page.waitForURL(landingUrl)
}
