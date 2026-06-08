import { test as base, expect } from "@playwright/test"
import type { APIRequestContext, Locator, Page } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

type Fixtures = {
  loginPage: LoginPage
}

export const test = base.extend<Fixtures>({
  // "provide" avoids triggering react-hooks/rules-of-hooks on the Playwright fixture callback
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page))
  },
})

export { expect }
export type { APIRequestContext, Locator, Page }
