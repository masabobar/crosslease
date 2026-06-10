import { test as setup } from "../fixtures/test"

const AUTH_STATE = ".auth/user.json"

setup("authenticate as system_admin", async ({ page }) => {
  const email = process.env.DEV_USER_EMAIL ?? ""
  const apiBase = process.env.E2E_API_BASE_URL ?? ""

  const response = await page.request.post(`${apiBase}/internal/test/session`, {
    data: { email },
  })

  if (!response.ok()) {
    throw new Error(
      `POST /internal/test/session failed: ${response.status()} ${response.statusText()}`
    )
  }

  await page.goto("/dashboard")
  await page.waitForURL("/dashboard")

  // POST /internal/test/session bypasses the OTP flow so LoginPage never calls
  // setAuthenticated(true). Write it directly so the Zustand persist layer
  // in the saved storageState reflects the authenticated state.
  await page.evaluate(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
    )
  })

  await page.context().storageState({ path: AUTH_STATE })
})
