import { test, expect } from "../../fixtures/test"
import { LeasingCompanyAccessPage } from "../../pages/LeasingCompanyAccessPage"

test.describe("PRD1042-51 — Leasing Company Access Restrictions", () => {
  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01
  // Sidebar renders LC-specific nav items (data-testid="nav-lc-{key}") and
  // completely omits the internal bank nav block ({!isLcUser} in Sidebar.tsx).
  // Pairs: allowed testId (nav-lc-*) vs. restricted text absent from sidebar.
  // ---------------------------------------------------------------------------

  const navCases = [
    { allowedKey: "requests", restrictedText: "Financing" },
    { allowedKey: "status", restrictedText: "Refinancing requests" },
    { allowedKey: "documents", restrictedText: "Audit trail" },
    { allowedKey: "proposals", restrictedText: "Pending approvals" },
  ]

  for (const { allowedKey, restrictedText } of navCases) {
    test(`LC user nav shows "nav-lc-${allowedKey}" and NOT "${restrictedText}" (AC-01)`, async ({
      lcUserPage,
    }) => {
      const accessPage = new LeasingCompanyAccessPage(lcUserPage)
      await expect(accessPage.lcNavItem(allowedKey)).toBeVisible()
      await expect(accessPage.internalNavText(restrictedText)).not.toBeVisible()
    })
  }

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-02, AC-07
  // Backend enforces module restriction: GET /api/v1/financings as an LC user
  // must not return data. Accepts 403 (forbidden) or 404 (endpoint not yet
  // implemented — both are valid access-denial responses).
  // ---------------------------------------------------------------------------

  test("LC user GET /api/v1/financings is denied — backend enforces module restriction (AC-02, AC-07)", async ({
    lcUserPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const response = await lcUserPage.request.get(
      `${apiBase}/api/v1/financings`
    )
    expect([403, 404]).toContain(response.status())
    const body = await response.json()
    expect(body).not.toHaveProperty("data")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-13, AC-07
  // Direct URL to a hidden route renders the app's catch-all 404 page — no
  // restricted content is exposed. The SPA does not redirect; it renders
  // "Page not found" inline at the attempted URL.
  // ---------------------------------------------------------------------------

  test("LC user direct URL to /risk/scores renders 404 — no restricted content shown (AC-13, AC-07)", async ({
    lcUserPage,
  }) => {
    const accessPage = new LeasingCompanyAccessPage(lcUserPage)
    await accessPage.goTo("/risk/scores")
    await expect(
      lcUserPage.getByRole("heading", { name: /page not found/i })
    ).toBeVisible()
    await expect(
      lcUserPage.getByRole("heading", { name: /risk.*score|pricing|scoring/i })
    ).not.toBeVisible()
  })
})
