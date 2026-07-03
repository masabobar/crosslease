import type { Locator, Page } from "../fixtures/test"

export class UserListPage {
  readonly page: Page
  readonly userTable: Locator
  readonly nameColumnHeader: Locator
  readonly paginationNextButton: Locator
  readonly paginationPreviousButton: Locator
  readonly exportButton: Locator
  // Export format options in the dropdown opened by exportButton
  readonly exportCsvOption: Locator
  readonly exportXlsxOption: Locator
  readonly navUserManagementLink: Locator
  // Search & quick filters
  readonly searchInput: Locator
  readonly emptyTableMessage: Locator
  readonly filterRoleButton: Locator
  readonly filterMfaButton: Locator
  readonly clearAllFiltersButton: Locator
  readonly dataRows: Locator
  readonly enabledActionMenuTriggers: Locator
  readonly filterPillRemoveMfa: Locator
  // Invitation dialog
  readonly createInviteButton: Locator
  readonly inviteDialog: Locator
  readonly inviteFirstNameInput: Locator
  readonly inviteLastNameInput: Locator
  readonly inviteEmailInput: Locator
  readonly inviteRoleSelect: Locator
  readonly inviteScopeSelect: Locator
  readonly inviteDialogSubmitButton: Locator
  readonly fourEyesAlert: Locator
  readonly successToast: Locator
  readonly inviteAccessValidFromInput: Locator
  readonly inviteAccessValidUntilInput: Locator

  constructor(page: Page) {
    this.page = page
    // Table is a div-based component — data-testid="user-table", not a semantic <table>
    this.userTable = page.getByTestId("user-table")
    // Sort buttons carry data-testid="sort-{key}" (e.g. sort-name, sort-status)
    this.nameColumnHeader = page.getByTestId("sort-name")
    this.paginationNextButton = page.getByRole("button", { name: /next/i })
    this.paginationPreviousButton = page.getByRole("button", {
      name: /previous/i,
    })
    // Export button has data-testid="export-button"; it opens a dropdown (not a direct download)
    this.exportButton = page.getByTestId("export-button")
    this.exportCsvOption = page.getByTestId("export-csv-option")
    this.exportXlsxOption = page.getByTestId("export-xlsx-option")
    this.navUserManagementLink = page.getByRole("link", {
      name: /user management/i,
    })
    // Search input and empty state.
    // Falls back to visible text "No users found." — data-testid="user-table-empty"
    // is not yet rendered by the frontend; update to getByTestId once the testid is added.
    this.searchInput = page.getByTestId("user-search-input")
    this.emptyTableMessage = page.getByText("No users found.")
    // Quick filter popover triggers — data-testid="filter-{key}-button"
    this.filterRoleButton = page.getByTestId("filter-role-button")
    this.filterMfaButton = page.getByTestId("filter-mfa-button")
    // Clear-all pill button — data-testid="filters-clear-all"
    this.clearAllFiltersButton = page.getByTestId("filters-clear-all")
    // Row and action locators
    this.dataRows = this.userTable.getByTestId(/^user-row-/)
    this.enabledActionMenuTriggers = this.userTable.getByLabel("Actions")
    this.filterPillRemoveMfa = page.getByTestId("filter-pill-remove-mfa")
    // Invitation dialog
    this.createInviteButton = page.getByRole("button", {
      name: /create.*invite|invite.*user/i,
    })
    this.inviteDialog = page.getByRole("dialog")
    this.inviteFirstNameInput = this.inviteDialog.getByRole("textbox", {
      name: /first name/i,
    })
    this.inviteLastNameInput = this.inviteDialog.getByRole("textbox", {
      name: /last name/i,
    })
    this.inviteEmailInput = this.inviteDialog.getByRole("textbox", {
      name: /email/i,
    })
    this.inviteRoleSelect = this.inviteDialog.getByRole("combobox", {
      name: /role/i,
    })
    this.inviteScopeSelect = this.inviteDialog.getByRole("combobox", {
      name: /scope|tenant|leasing company/i,
    })
    this.inviteDialogSubmitButton = this.inviteDialog.getByRole("button", {
      name: /create|invite|submit/i,
    })
    // Four-Eyes alert shown inside the dialog when a privileged role is selected
    // The element uses no ARIA role — match by visible heading text
    this.fourEyesAlert = this.inviteDialog.getByText(
      /four.eyes approval required/i
    )
    this.successToast = page.getByRole("status")
    // Auditor-only date range fields (required when role = Auditor)
    this.inviteAccessValidFromInput =
      this.inviteDialog.getByLabel(/access valid from/i)
    this.inviteAccessValidUntilInput =
      this.inviteDialog.getByLabel(/access valid until/i)
  }

  async goto(): Promise<void> {
    await this.page.goto("/platform-administration/user-management")
    // Wait for TanStack Query to finish the initial user fetch before assertions
    await this.page.waitForLoadState("networkidle")
  }

  // Returns the name text from each visible data row.
  // Uses evaluateAll() to snapshot all rows in a single DOM pass — avoids stale-element
  // errors that arise when iterating with innerText() across a re-rendering list.
  async getVisibleNames(): Promise<string[]> {
    await this.dataRows.first().waitFor({ state: "visible" })
    return this.dataRows.evaluateAll(rows =>
      rows.map(row => {
        const p = row.querySelector("p")
        return p?.innerText.trim() ?? ""
      })
    )
  }

  // Sort key map: human-readable column name → data-testid key used on sort buttons.
  async sortByColumn(columnName: string): Promise<void> {
    const KEY_MAP: Record<string, string> = {
      Name: "name",
      Role: "role",
      Tenant: "tenant_name",
      Status: "status",
      "Last login": "last_login",
      "Access expiry": "access_valid_until",
    }
    const key =
      KEY_MAP[columnName] ?? columnName.toLowerCase().replace(/\s+/g, "_")
    // waitForLoadState("networkidle") resolves immediately when the page is already
    // idle — it does NOT wait for the NEXT request. Register the response listener
    // BEFORE the click so the sort API response is captured, not missed.
    // Regex matches /api/v1/users?... (list endpoint) but not /users/me or /users/{id}/action.
    const responsePromise = this.page.waitForResponse(
      resp =>
        /\/api\/v1\/users(\?|$)/.test(resp.url()) &&
        resp.request().method() === "GET",
      { timeout: 15000 }
    )
    // press("Enter") on a focused <button> is equivalent to a click and bypasses
    // Playwright's pointer-interception check (adjacent column div overlaps the center).
    await this.page.getByTestId(`sort-${key}`).press("Enter")
    await responsePromise
    // After the response arrives, wait for React to commit the re-render to DOM
    await this.page.waitForLoadState("networkidle")
  }

  async openCreateInviteDialog(): Promise<void> {
    await this.createInviteButton.click()
    await this.inviteDialog.waitFor({ state: "visible" })
  }

  async fillInviteForm(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    await this.inviteFirstNameInput.fill(firstName)
    await this.inviteLastNameInput.fill(lastName)
    await this.inviteEmailInput.fill(email)
  }

  async selectInviteRole(role: string): Promise<void> {
    await this.inviteRoleSelect.click()
    await this.page.getByRole("option", { name: role }).click()
  }

  async selectInviteScope(scope: string): Promise<void> {
    await this.inviteScopeSelect.click()
    // Try named option first; fall back to first available (tenant/LC IDs are env-dependent)
    const named = this.page.getByRole("option", { name: scope, exact: false })
    if ((await named.count()) > 0) {
      await named.first().click()
    } else {
      await this.page.getByRole("option").first().click()
    }
  }

  async submitInviteDialog(): Promise<void> {
    await this.inviteDialogSubmitButton.click()
  }

  // Returns the number of role options visible in the invite role dropdown.
  // Opens and closes the dropdown automatically.
  async countRoleOptions(): Promise<number> {
    await this.inviteRoleSelect.click()
    // Wait for the first option to render before counting — .count() is not auto-retrying
    await this.page.getByRole("option").first().waitFor({ state: "visible" })
    const count = await this.page.getByRole("option").count()
    await this.page.keyboard.press("Escape")
    return count
  }

  // Selects a tenant/LC scope only when the scope combobox is present in the
  // dialog. Platform-level roles (system_admin, support_user) may omit it.
  async trySelectInviteScope(scope: string): Promise<void> {
    const isVisible = await this.inviteScopeSelect.isVisible()
    if (isVisible) {
      await this.selectInviteScope(scope)
    }
  }

  // Auditor invitations require a mandatory access validity window.
  // validFrom / validUntil must be ISO date strings ("YYYY-MM-DD").
  async fillAuditorAccessDates(
    validFrom: string,
    validUntil: string
  ): Promise<void> {
    await this.inviteAccessValidFromInput.fill(validFrom)
    await this.inviteAccessValidUntilInput.fill(validUntil)
  }

  // Fill only the valid-from date — used when testing that missing valid-until is rejected (AC-06).
  async fillAccessValidFrom(date: string): Promise<void> {
    await this.inviteAccessValidFromInput.fill(date)
  }

  // Fill only the valid-until date — used when testing that missing valid-from is rejected (AC-06).
  async fillAccessValidUntil(date: string): Promise<void> {
    await this.inviteAccessValidUntilInput.fill(date)
  }

  // Returns the status badge element for the row matching the given text (typically email).
  getUserStatusInRow(rowText: string): Locator {
    return this.userTable
      .getByTestId(/^user-row-/)
      .filter({ hasText: rowText })
      .getByText(/Active|Invited|Pending|Suspended|Deactivated|Expired/i)
  }

  // Returns the role badge element for the row matching rowText.
  getUserRoleInRow(rowText: string): Locator {
    return this.userTable
      .getByTestId(/^user-row-/)
      .filter({ hasText: rowText })
      .getByText(
        /Front Office|Back Office|Leasing Co\. User|Admin|Auditor|Support/i
      )
  }

  async openContextMenuForUser(email: string): Promise<void> {
    await this.userTable
      .getByTestId(/^user-row-/)
      .filter({ hasText: email })
      .getByLabel("Actions")
      .click()
  }

  async clickContextMenuItem(option: string): Promise<void> {
    await this.page
      .getByRole("menuitem", { name: new RegExp(option, "i") })
      .click()
  }

  // Fills the search input with `term` and waits for the API to respond with
  // that specific search term.  Filtering by q=<term> prevents resolving on a
  // concurrent background refresh that carries no search param.
  async search(term: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      resp =>
        /\/api\/v1\/users(\?|$)/.test(resp.url()) &&
        resp.request().method() === "GET" &&
        new URL(resp.url()).searchParams.get("search") === term,
      { timeout: 15000 }
    )
    await this.searchInput.fill(term)
    await responsePromise
    await this.page.waitForLoadState("networkidle")
  }

  // Opens the role filter popover, toggles one role option, then closes the popover.
  async selectRoleFilter(role: string): Promise<void> {
    await this.filterRoleButton.click()
    const option = this.page.getByTestId(`filter-option-role-${role}`)
    await option.waitFor({ state: "visible" })
    await option.click()
    await this.page.keyboard.press("Escape")
  }

  // Opens the MFA filter popover, selects one value, then closes the popover.
  async selectMfaFilter(value: string): Promise<void> {
    await this.filterMfaButton.click()
    const option = this.page.getByTestId(`filter-option-mfa-${value}`)
    await option.waitFor({ state: "visible" })
    await option.click()
    await this.page.keyboard.press("Escape")
  }

  // Returns the X-remove button inside the active role filter chip.
  filterPillRemoveRole(role: string): Locator {
    return this.page.getByTestId(`filter-pill-remove-role-${role}`)
  }
}
