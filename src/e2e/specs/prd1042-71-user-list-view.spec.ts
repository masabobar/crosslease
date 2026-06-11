import { expect, test } from "../fixtures/test"
import { createTestSession } from "../helpers/helper"
import { UserListPage } from "../pages/UserListPage"

// ---------------------------------------------------------------------------
// PRD1042-71 — User List View
// E2E-ready scenarios only. Cross-tenant scenarios (AC-02, AC-14 cross-tenant)
// are marked fixme — require D20 (second seeded Bank Tenant B).
// ---------------------------------------------------------------------------

// Bank roles that have access to the User List View.
const BANK_ROLES = [
  { role: "system_admin", emailVar: "DEV_USER_EMAIL" },
  { role: "front_office", emailVar: "DEV_FRONT_OFFICE_USER_EMAIL" },
  { role: "back_office_risk", emailVar: "DEV_BACK_OFFICE_USER_EMAIL" },
  { role: "support_user", emailVar: "DEV_SUPPORT_USER_EMAIL" },
  { role: "auditor", emailVar: "DEV_AUDIT_USER_EMAIL" },
] as const

// Read-only roles — must not see edit / suspend / deactivate actions.
const READ_ONLY_ROLES = [
  { role: "support_user", emailVar: "DEV_SUPPORT_USER_EMAIL" },
  { role: "auditor", emailVar: "DEV_AUDIT_USER_EMAIL" },
] as const

test.describe("PRD1042-71 — User List View", () => {
  // ---------------------------------------------------------------------------
  // AC-01, AC-04: Authorized users see scoped user records with lifecycle status
  // Covers all bank roles that have access to the User Management module.
  // ---------------------------------------------------------------------------

  for (const { role, emailVar } of BANK_ROLES) {
    test(`${role} can view user list within their authorized scope (AC-01, AC-04)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, process.env[emailVar] ?? "")

      const userListPage = new UserListPage(page)
      await userListPage.goto()

      await expect(userListPage.userTable).toBeVisible()

      // At least one data row must be present.
      const firstRow = userListPage.dataRows().first()
      await expect(firstRow).toBeVisible()

      // Each visible row must show a recognised lifecycle status.
      const rows = userListPage.dataRows()
      const count = await rows.count()
      for (let i = 0; i < count; i++) {
        const rowText = await rows.nth(i).innerText()
        const hasKnownStatus =
          /active|invited|suspended|expired|deactivated/i.test(rowText)
        expect
          .soft(hasKnownStatus, `Row ${i} must show a known lifecycle status`)
          .toBe(true)
      }

      await context.close()
    })
  }

  // ---------------------------------------------------------------------------
  // AC-06: Sorting by Name column reorders results
  // Clicks Name header twice — asserts ascending then descending order.
  // ---------------------------------------------------------------------------

  test("sorting by Name column produces ordered results (AC-06)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    const userListPage = new UserListPage(page)
    await userListPage.goto()
    await expect(userListPage.userTable).toBeVisible()

    // Sort ascending.
    await userListPage.sortByColumn("Name")
    const namesAsc = await userListPage.getVisibleNames()

    if (namesAsc.length > 1) {
      const sortedAsc = [...namesAsc].sort((a, b) => a.localeCompare(b))
      expect(namesAsc).toEqual(sortedAsc)
    }

    // Sort descending (second click reverses order).
    await userListPage.sortByColumn("Name")
    const namesDesc = await userListPage.getVisibleNames()

    if (namesDesc.length > 1) {
      const sortedDesc = [...namesDesc].sort((a, b) => b.localeCompare(a))
      expect(namesDesc).toEqual(sortedDesc)
    }

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-07: Pagination — first page shows at most 50 records; controls navigate
  // If fewer than 50 users exist the table renders without pagination controls.
  // ---------------------------------------------------------------------------

  test("user list respects 50-record page cap and pagination controls navigate (AC-07)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    const userListPage = new UserListPage(page)
    await userListPage.goto()
    await expect(userListPage.userTable).toBeVisible()

    const rowCount = await userListPage.dataRows().count()
    expect(rowCount).toBeLessThanOrEqual(50)

    // If pagination controls exist, verify Next navigates to a different page.
    const nextVisible = await userListPage.paginationNextButton.isVisible()
    if (nextVisible) {
      const namesBefore = await userListPage.getVisibleNames()
      await userListPage.paginationNextButton.click()
      await page.waitForLoadState("networkidle")
      const namesAfter = await userListPage.getVisibleNames()
      expect(namesAfter).not.toEqual(namesBefore)
    }

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-14: Export button initiates a scoped file download
  // Intercepts the download event — does not depend on file content.
  // ---------------------------------------------------------------------------

  test("export button initiates a file download within authorized scope (AC-14)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    const userListPage = new UserListPage(page)
    await userListPage.goto()
    await expect(userListPage.exportButton).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      userListPage.exportButton.click(),
    ])

    expect(download.suggestedFilename()).toBeTruthy()

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-03: Leasing Company User — User Management nav entry absent
  // LC user lands on /lc; sidebar must not expose a User Management link.
  // ---------------------------------------------------------------------------

  test("User Management nav entry is absent for leasing_company_user (AC-03)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_LCO_USER_EMAIL ?? "", "/lc")

    const userListPage = new UserListPage(page)
    await expect(userListPage.navUserManagementLink).not.toBeVisible()

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-03: Leasing Company User — direct route access is blocked
  // Navigating to /platform-administration/user-management must redirect the
  // LC user away (ProtectedLayout redirects LC users to /lc).
  // ---------------------------------------------------------------------------

  test("direct route access to user list redirects leasing_company_user (AC-03)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_LCO_USER_EMAIL ?? "", "/lc")

    await page.goto("/platform-administration/user-management")
    await page.waitForLoadState("networkidle")

    // ProtectedLayout redirects LC users back to their workspace; must not render the list.
    await expect(page).not.toHaveURL("/platform-administration/user-management")
    await expect(page.getByRole("table")).not.toBeVisible()

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-10: Support User and Auditor see no modification actions in user rows
  // Edit, Suspend, and Deactivate controls must be absent from every row.
  // ---------------------------------------------------------------------------

  for (const { role, emailVar } of READ_ONLY_ROLES) {
    test(`${role} sees no modification actions in user rows (AC-10)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, process.env[emailVar] ?? "")

      const userListPage = new UserListPage(page)
      await userListPage.goto()
      await expect(userListPage.userTable).toBeVisible()

      await expect(
        page.getByRole("button", { name: /^edit$/i }).first()
      ).not.toBeVisible()
      await expect(
        page.getByRole("button", { name: /^suspend$/i }).first()
      ).not.toBeVisible()
      await expect(
        page.getByRole("button", { name: /^deactivate$/i }).first()
      ).not.toBeVisible()

      await context.close()
    })
  }

  // ---------------------------------------------------------------------------
  // BLOCKED — D20: Second seeded Bank Tenant B not yet provisioned.
  // ---------------------------------------------------------------------------

  test.fixme("cross-tenant request returns 404 not 403 (AC-02)", async () => {
    // D20: requires a second seeded Bank Tenant B with one test user.
  })

  test.fixme("cross-tenant export attempt is blocked server-side (AC-14)", async () => {
    // D20: requires a second seeded Bank Tenant B with one test user.
  })
})
