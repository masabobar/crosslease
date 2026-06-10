import { test as base, expect } from "@playwright/test"
import type { APIRequestContext, Locator, Page } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

type Fixtures = {
  loginPage: LoginPage
  authenticatedPage: Page
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
})

export { expect }
export type { APIRequestContext, Locator, Page }
