import type { Locator, Page } from "../fixtures/test"

export class UserDetailPage {
  readonly page: Page
  // Quick-view dialog — opens when a user row is clicked from the user list
  readonly userDetailDialog: Locator
  // Action buttons inside the dialog — visible to Power User only, hidden for Support/Auditor
  readonly suspendUserButton: Locator
  readonly deactivateUserButton: Locator
  // Navigation
  readonly navUserManagementLink: Locator
  // Full user detail page (route: /platform-administration/user-management/{id})
  // Identity inline-edit section — testids from UserDetailPage.tsx
  readonly userDetailPageContainer: Locator
  readonly identityEditButton: Locator
  readonly identitySaveButton: Locator
  readonly identityCancelButton: Locator
  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly phoneInput: Locator
  readonly roleScopeEditButton: Locator
  // Self-profile page (route: /settings/profile) — same testid naming convention
  readonly selfProfilePageContainer: Locator

  constructor(page: Page) {
    this.page = page
    // Clicking a user row opens a role=dialog quick-view panel (not a page navigation)
    this.userDetailDialog = page.getByRole("dialog")
    // Action buttons are scoped to the dialog to avoid false positives from other page buttons
    this.suspendUserButton = this.userDetailDialog.getByRole("button", {
      name: /suspend user/i,
    })
    this.deactivateUserButton = this.userDetailDialog.getByRole("button", {
      name: /deactivate user/i,
    })
    // Nav link — used by AC-16 to verify the link is absent for LC users
    this.navUserManagementLink = page.getByRole("link", {
      name: /user management/i,
    })
    // Full user detail page locators
    this.userDetailPageContainer = page.getByTestId("user-detail-page")
    this.identityEditButton = page.getByTestId("identity-edit-button")
    this.identitySaveButton = page.getByTestId("identity-save-button")
    this.identityCancelButton = page.getByTestId("identity-cancel-button")
    this.firstNameInput = page.getByTestId("identity-first-name-input")
    this.lastNameInput = page.getByTestId("identity-last-name-input")
    this.phoneInput = page.getByTestId("phone-number-input")
    this.roleScopeEditButton = page.getByTestId("role-scope-edit-button")
    // Self-profile page locators
    this.selfProfilePageContainer = page.getByTestId("self-profile-page")
  }

  // Navigate directly to a full user detail page by UUID.
  async goto(userId: string): Promise<void> {
    await this.page.goto(`/platform-administration/user-management/${userId}`)
    await this.page.waitForLoadState("networkidle")
  }

  // Navigate to the self-profile page (/settings/profile).
  async gotoSelfProfile(): Promise<void> {
    await this.page.goto("/settings/profile")
    await this.page.waitForLoadState("networkidle")
  }

  // Navigate to the user list and open the quick-view dialog for the first available row.
  // Waits for the dialog to become visible before returning.
  async openFromFirstRow(): Promise<void> {
    const firstRow = this.page.getByTestId(/^user-row-/).first()
    await firstRow.waitFor({ state: "visible" })
    await firstRow.click()
    await this.userDetailDialog.waitFor({ state: "visible" })
  }

  // Open the quick-view for the first row whose status badge reads "Active".
  // Use this when the test asserts on actions only available for active users
  // (Suspend, Deactivate) — Pending/Invited rows do not show those buttons.
  async openFirstActiveUserRow(): Promise<void> {
    const activeRow = this.page
      .getByTestId(/^user-row-/)
      .filter({ hasText: /\bActive\b/ })
      .first()
    await activeRow.waitFor({ state: "visible" })
    await activeRow.click()
    await this.userDetailDialog.waitFor({ state: "visible" })
  }

  // Navigate to the user list, search for the user by email, then open their quick-view dialog.
  // Uses the search input to scope the list to one result before clicking.
  async openByEmail(email: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      resp =>
        /\/api\/v1\/users(\?|$)/.test(resp.url()) &&
        resp.request().method() === "GET",
      { timeout: 15000 }
    )
    await this.page.getByTestId("user-search-input").fill(email)
    await responsePromise
    await this.page.waitForLoadState("networkidle")
    const matchingRow = this.page.getByTestId(/^user-row-/).first()
    await matchingRow.waitFor({ state: "visible" })
    await matchingRow.click()
    await this.userDetailDialog.waitFor({ state: "visible" })
  }
}
