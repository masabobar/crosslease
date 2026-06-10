import type { Locator, Page } from "../fixtures/test"

export class SecureLogoutPage {
  readonly page: Page
  readonly profileButton: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.page = page
    this.profileButton = page.getByTestId("header-profile-button")
    this.logoutButton = page.getByTestId("header-logout-button")
  }

  async openProfileMenu(): Promise<void> {
    await this.profileButton.click()
    await this.logoutButton.waitFor({ state: "visible" })
  }

  async logout(): Promise<void> {
    await this.openProfileMenu()
    await this.logoutButton.click()
  }
}
