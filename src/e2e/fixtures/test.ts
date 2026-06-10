import { test as base, expect } from "@playwright/test"
import type { APIRequestContext, Locator, Page } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

type Fixtures = {
  loginPage: LoginPage
  authenticatedPage: Page
  bankProcessorPage: Page
  lcUserPage: Page
  auditorPage: Page
}

export const test = base.extend<Fixtures>({
  // "provide" avoids triggering react-hooks/rules-of-hooks on the Playwright fixture callback
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page))
  },

  // Pre-authenticated session loaded from .auth/user.json (saved by auth.setup.ts)
  authenticatedPage: async ({ browser }, provide) => {
    const context = await browser.newContext({
      storageState: ".auth/user.json",
    })
    const page = await context.newPage()
    await provide(page)
    await context.close()
  },

  // Pre-authenticated session — bank front_office role
  bankProcessorPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_BANK_USER_EMAIL ?? "",
      process.env.TEST_BANK_USER_PASSWORD ?? ""
    )
    await page.waitForURL("/dashboard")
    await provide(page)
    await context.close()
  },

  // Pre-authenticated session — leasing_company_user role
  lcUserPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_LC_USER_EMAIL ?? "",
      process.env.TEST_LC_USER_PASSWORD ?? ""
    )
    await page.waitForURL("/workspace")
    await provide(page)
    await context.close()
  },

  // Pre-authenticated session — auditor role
  auditorPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_AUDITOR_EMAIL ?? "",
      process.env.TEST_AUDITOR_PASSWORD ?? ""
    )
    await page.waitForURL("/dashboard")
    await provide(page)
    await context.close()
  },
})

export { expect }
export type { APIRequestContext, Locator, Page }
