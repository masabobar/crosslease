import type { Locator, Page } from "../fixtures/test"

export class UserListPage {
  readonly page: Page
  readonly userTable: Locator
  readonly nameColumnHeader: Locator
  readonly paginationNextButton: Locator
  readonly paginationPreviousButton: Locator
  readonly exportButton: Locator
  readonly navUserManagementLink: Locator

  constructor(page: Page) {
    this.page = page
    this.userTable = page.getByRole("table")
    this.nameColumnHeader = page.getByRole("columnheader", { name: /^name$/i })
    this.paginationNextButton = page.getByRole("button", { name: /next/i })
    this.paginationPreviousButton = page.getByRole("button", {
      name: /previous/i,
    })
    this.exportButton = page.getByRole("button", { name: /export/i })
    this.navUserManagementLink = page.getByRole("link", {
      name: /user management/i,
    })
  }

  async goto(): Promise<void> {
    await this.page.goto("/platform-administration/user-management")
    await this.page.waitForURL("/platform-administration/user-management")
  }

  // Returns all data rows (excludes the header row).
  dataRows(): Locator {
    return this.userTable
      .getByRole("row")
      .filter({ hasNot: this.page.getByRole("columnheader") })
  }

  // Returns the text content of the Name cell in each visible data row.
  async getVisibleNames(): Promise<string[]> {
    const rows = this.dataRows()
    const count = await rows.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).getByRole("cell").first().innerText()
      names.push(text.trim())
    }
    return names
  }

  async sortByColumn(columnName: string): Promise<void> {
    await this.page
      .getByRole("columnheader", { name: new RegExp(`^${columnName}$`, "i") })
      .click()
    await this.page.waitForLoadState("networkidle")
  }
}
