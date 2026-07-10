import type { Locator, Page } from "../fixtures/test"

export class TenantListPage {
  readonly page: Page
  readonly heading: Locator
  readonly lifecycleStatusFilter: Locator
  readonly tenantRows: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole("heading", { name: /tenant/i })
    this.lifecycleStatusFilter = page.getByRole("combobox", {
      name: /lifecycle status/i,
    })
    this.tenantRows = page.getByRole("row")
  }

  async goto() {
    await this.page.goto("/platform-administration/tenant-management")
    await this.page.waitForLoadState("networkidle")
  }

  async applyLifecycleStatusFilter(value: string) {
    await this.lifecycleStatusFilter.click()
    await this.page.getByRole("option", { name: value }).click()
    await this.page.waitForLoadState("networkidle")
  }
}
