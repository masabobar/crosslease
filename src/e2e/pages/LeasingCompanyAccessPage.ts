import type { Locator, Page } from "../fixtures/test"

export class LeasingCompanyAccessPage {
  readonly page: Page
  readonly sidebar: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.getByTestId("app-sidebar")
  }

  // LC nav items are rendered with data-testid="nav-lc-{key}" (key: requests | status | documents | proposals).
  lcNavItem(key: string): Locator {
    return this.sidebar.getByTestId(`nav-lc-${key}`)
  }

  // Internal bank nav items are in the {!isLcUser} block — completely absent from DOM for LC users.
  // Scoped to sidebar to avoid false matches in page content.
  internalNavText(text: string): Locator {
    return this.sidebar.getByText(text, { exact: true })
  }

  async goTo(path: string): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForLoadState("networkidle")
  }
}
