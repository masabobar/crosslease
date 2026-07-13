import { test as base, expect } from "@playwright/test"
import type {
  APIRequestContext,
  APIResponse,
  Locator,
  Page,
} from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

type Fixtures = {
  loginPage: LoginPage
  authenticatedPage: Page
  bankProcessorPage: Page
  lcUserPage: Page
  auditorPage: Page
  supportPage: Page
}

export const test = base.extend<Fixtures>({
  // "provide" avoids triggering react-hooks/rules-of-hooks on the Playwright fixture callback
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page))
  },

  // Pre-authenticated session — system_admin role
  // Creates a fresh session per test via /internal/test/session to avoid JWT expiry
  // between auth-setup and test execution (access token TTL = 30 min).
  authenticatedPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const apiBase = process.env.E2E_API_BASE_URL ?? ""
      const email = process.env.E2E_SYSTEM_ADMIN_EMAIL ?? ""
      const response = await page.request.post(
        `${apiBase}/internal/test/session`,
        { data: { email } }
      )
      if (!response.ok()) {
        throw new Error(
          `authenticatedPage session creation failed: ${response.status()}`
        )
      }
      await page.goto("/")
      await page.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })
      await provide(page)
    } finally {
      await context.close()
    }
  },

  // Pre-authenticated session — bank front_office role
  bankProcessorPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(
        process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
        process.env.E2E_FRONT_OFFICE_USER_PASSWORD ?? ""
      )
      await page.waitForURL("/dashboard")
      await provide(page)
    } finally {
      await context.close()
    }
  },

  // Pre-authenticated session — leasing_company_user role
  // Uses /internal/test/session to bypass OTP — LC users require email verification
  // which cannot be automated without mailbox access.
  lcUserPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const apiBase = process.env.E2E_API_BASE_URL ?? ""
      const response = await page.request.post(
        `${apiBase}/internal/test/session`,
        { data: { email: process.env.E2E_LCO_USER_EMAIL ?? "" } }
      )
      if (!response.ok()) {
        throw new Error(
          `lcUserPage session creation failed: ${response.status()}`
        )
      }
      // Go to root first so localStorage is writable, then set auth state and
      // navigate to the LC workspace. The /lc route requires the Zustand auth flag.
      await page.goto("/")
      await page.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })
      await page.goto("/lc")
      await page.waitForLoadState("networkidle")
      await provide(page)
    } finally {
      await context.close()
    }
  },

  // Pre-authenticated session — support_user role
  // Uses /internal/test/session to bypass OTP — same approach as authenticatedPage.
  supportPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const apiBase = process.env.E2E_API_BASE_URL ?? ""
      const response = await page.request.post(
        `${apiBase}/internal/test/session`,
        { data: { email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" } }
      )
      if (!response.ok()) {
        throw new Error(
          `supportPage session creation failed: ${response.status()}`
        )
      }
      await page.goto("/")
      await page.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })
      await provide(page)
    } finally {
      await context.close()
    }
  },

  // Pre-authenticated session — auditor role
  // Uses /internal/test/session (same as authenticatedPage) to bypass OTP and avoid
  // waitForURL("/dashboard") — auditors may land on a different route after login.
  auditorPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const apiBase = process.env.E2E_API_BASE_URL ?? ""
      const response = await page.request.post(
        `${apiBase}/internal/test/session`,
        { data: { email: process.env.E2E_AUDIT_USER_EMAIL ?? "" } }
      )
      if (!response.ok()) {
        throw new Error(
          `auditorPage session creation failed: ${response.status()}`
        )
      }
      await page.goto("/")
      await page.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })
      await provide(page)
    } finally {
      await context.close()
    }
  },
})

export { expect }
export type { APIRequestContext, APIResponse, Locator, Page }
