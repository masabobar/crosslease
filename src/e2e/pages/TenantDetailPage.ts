import type { Locator, Page } from "../fixtures/test"

export class TenantDetailPage {
  readonly page: Page
  readonly identityStatusTab: Locator
  readonly moduleProfileTab: Locator
  readonly configurationOverridesTab: Locator
  readonly integrationBindingTab: Locator
  readonly governanceHistoryTab: Locator
  readonly accessPolicyTab: Locator
  readonly supportAccessGrantsTab: Locator

  constructor(page: Page) {
    this.page = page
    this.identityStatusTab = page.getByRole("tab", {
      name: /identity.*status/i,
    })
    this.moduleProfileTab = page.getByRole("tab", { name: /module profile/i })
    this.configurationOverridesTab = page.getByRole("tab", {
      name: /configuration overrides/i,
    })
    this.integrationBindingTab = page.getByRole("tab", {
      name: /integration binding/i,
    })
    this.governanceHistoryTab = page.getByRole("tab", {
      name: /governance history/i,
    })
    this.accessPolicyTab = page.getByRole("tab", { name: /access policy/i })
    this.supportAccessGrantsTab = page.getByRole("tab", {
      name: /support access grants/i,
    })
  }

  async goto(tenantId: string) {
    await this.page.goto(
      `/platform-administration/tenant-management/${tenantId}`
    )
    await this.page.waitForLoadState("networkidle")
  }
}
