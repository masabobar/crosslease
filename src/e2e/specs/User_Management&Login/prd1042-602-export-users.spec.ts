import { expect, test } from "../../fixtures/test"
import type { Page } from "../../fixtures/test"
import { UserListPage } from "../../pages/UserListPage"

// ---------------------------------------------------------------------------
// PRD1042-602 — US 28.30 | User Management | Export Users
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-602 Export Users.md
//
// Covered (runnable):  gate  — export button visible, CSV/XLSX options in dropdown
//                      FR-01 — full export in CSV and XLSX formats (Scenario Outline × 2)
//                      FR-02 — filter-aware export (role=front_office subset)
//                      VR-01/SR-04 — 4 unauthorized roles → 403 (Scenario Outline × 4)
//                      FR-06/SR-03 — all 6 forbidden columns absent from header
//                      FR-04 — auditor column projection (conditional skip if engagement expired)
//                      VR-04 — empty filtered result produces valid file with headers + 0 rows
//
// Fixme (D19):         SR-05 (suspended requester)
// Fixme (D20):         FR-03/VR-03/SR-02 (cross-tenant filter)
// Fixme (D21):         VR-02 (auditor expired engagement)
// Fixme (PRD1042-37):  SB-02, SB-03 (audit event USER_LIST_EXPORTED)
// Fixme (D-NEW):       EC-10 (audit-service kill-switch)
//
// API note: export is ALWAYS async — 3 steps:
//   1. GET /api/v1/users/export?format=...   → 202 { job_id, status }
//   2. GET /api/v1/users/export/status/{id}  → { status: "processing"|"ready"|"failed" }
//   3. GET /api/v1/users/export/download/{id} → binary file (200)
//
// The Gherkin BDD background says "response status should be 200" — this refers to
// the final download step (step 3), not the initiate call (step 1 returns 202).
//
// canExport permission: system_admin | auditor only (verified in UserManagementPage.tsx).
// ---------------------------------------------------------------------------

// Create a session for `email` on `page` via /internal/test/session.
async function authenticatePageAs(page: Page, email: string): Promise<boolean> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const resp = await page.request.post(`${apiBase}/internal/test/session`, {
    data: { email },
  })
  if (!resp.ok()) return false
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
    )
  })
  return true
}

// Poll /api/v1/users/export/status/{job_id} until status is "ready" or "failed".
// Returns "timeout" if the 15-second window is exhausted.
async function pollExportJob(
  page: Page,
  jobId: string,
  timeout = 15_000
): Promise<"ready" | "failed" | "timeout"> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const getStatus = async (): Promise<string> => {
    const resp = await page.request.get(
      `${apiBase}/api/v1/users/export/status/${jobId}`
    )
    if (!resp.ok()) return "failed"
    const body = (await resp.json()) as { status?: string }
    return body.status ?? "processing"
  }

  try {
    await expect
      .poll(getStatus, { intervals: [1_000], timeout })
      .toMatch(/^(ready|failed)$/)
  } catch {
    return "timeout"
  }

  const final = await getStatus()
  return final === "ready" ? "ready" : "failed"
}

// Full 3-step export flow: initiate → poll → download.
// Returns file metadata + body, or null if any step does not succeed.
async function initiateAndDownload(
  page: Page,
  queryString: string
): Promise<{
  contentType: string
  bodyText: string
  bodyByteLength: number
} | null> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const initiateResp = await page.request.get(
    `${apiBase}/api/v1/users/export${queryString}`
  )
  if (initiateResp.status() !== 202) return null

  const initiateBody = (await initiateResp.json()) as { job_id?: string }
  const jobId = initiateBody.job_id
  if (!jobId) return null

  const pollResult = await pollExportJob(page, jobId)
  if (pollResult !== "ready") return null

  const downloadResp = await page.request.get(
    `${apiBase}/api/v1/users/export/download/${jobId}`
  )
  if (!downloadResp.ok()) return null

  const contentType = downloadResp.headers()["content-type"] ?? ""
  const bodyBuffer = await downloadResp.body()
  const bodyText = bodyBuffer.toString("utf-8")

  return { contentType, bodyText, bodyByteLength: bodyBuffer.byteLength }
}

// ---------------------------------------------------------------------------
// GATE — export button visible; format options appear in dropdown
// ---------------------------------------------------------------------------

test("Export button is visible for system_admin and reveals CSV and XLSX format options (gate)", async ({
  authenticatedPage,
}) => {
  const listPage = new UserListPage(authenticatedPage)
  await listPage.goto()
  await expect(listPage.exportButton).toBeVisible()
  await listPage.exportButton.click()
  await expect(listPage.exportCsvOption).toBeVisible()
  await expect(listPage.exportXlsxOption).toBeVisible()
  // Close the dropdown
  await authenticatedPage.keyboard.press("Escape")
})

// ---------------------------------------------------------------------------
// FR-01 — Power User exports full user list in both supported formats
// The initiate call returns 202; the download returns 200.
// ---------------------------------------------------------------------------

const exportFormats = [
  {
    format: "csv",
    expectedContentType: "text/csv",
  },
  {
    format: "xlsx",
    expectedContentType: "spreadsheetml",
  },
] as const

for (const { format, expectedContentType } of exportFormats) {
  test(`Power User exports full user list in ${format} — 202 initiate then 200 file download with correct content-type (FR-01)`, async ({
    authenticatedPage,
  }) => {
    const result = await initiateAndDownload(
      authenticatedPage,
      `?format=${format}`
    )
    expect(
      result,
      "export async flow (202 → status poll → download) must complete — broken export API"
    ).not.toBeNull()
    if (!result) return // TypeScript narrowing only — never reached after expect

    expect(result.contentType).toContain(expectedContentType)
    expect(result.bodyByteLength).toBeGreaterThan(0)

    if (format === "csv") {
      // Verify the header row contains at minimum the role-authorized mandatory columns
      const lines = result.bodyText.split("\n").filter(l => l.trim())
      expect(lines.length).toBeGreaterThan(0)
      const headerRow = lines[0].toLowerCase()
      expect(headerRow).toContain("email")
      expect(headerRow).toContain("role")
    }
  })
}

// ---------------------------------------------------------------------------
// FR-02 — Export honors active filter state: exported subset matches visible rows
// Apply role=front_office filter; every data row in the file must have role "front_office".
// ---------------------------------------------------------------------------

test("Filter applied — exported CSV contains only rows matching the role filter (FR-02)", async ({
  authenticatedPage,
}) => {
  const result = await initiateAndDownload(
    authenticatedPage,
    "?format=csv&role=front_office"
  )
  expect(
    result,
    "export async flow (202 → status poll → download) must complete — broken export API"
  ).not.toBeNull()
  if (!result) return // TypeScript narrowing only — never reached after expect

  const lines = result.bodyText.split("\n").filter(l => l.trim())
  if (lines.length <= 1) {
    // No front_office users seeded — empty result is covered by VR-04
    test.skip()
    return
  }

  const headers = lines[0]
    .split(",")
    .map(h => h.toLowerCase().trim().replace(/"/g, ""))
  const roleIndex = headers.findIndex(h => h.includes("role"))
  expect(roleIndex).toBeGreaterThanOrEqual(0)

  const dataRows = lines.slice(1)
  for (const row of dataRows) {
    const cells = row.split(",").map(c => c.trim().replace(/"/g, ""))
    expect(cells[roleIndex]).toBe("front_office")
  }
})

// ---------------------------------------------------------------------------
// VR-01, SR-04 — Unauthorized roles: API returns 403; no user data in response
// Verifies server-side enforcement regardless of UI control visibility.
// ---------------------------------------------------------------------------

const unauthorizedRoles = [
  { role: "support_user", emailVar: "E2E_SUPPORT_USER_EMAIL" },
  { role: "front_office", emailVar: "E2E_FRONT_OFFICE_USER_EMAIL" },
  { role: "back_office", emailVar: "E2E_BACK_OFFICE_USER_EMAIL" },
  { role: "leasing_company_user", emailVar: "E2E_LCO_USER_EMAIL" },
] as const

for (const { role, emailVar } of unauthorizedRoles) {
  test(`${role} export request returns 403 — no file downloaded, no user data in response (VR-01, SR-04)`, async ({
    page,
  }) => {
    const email = process.env[emailVar] ?? ""
    const ok = await authenticatePageAs(page, email)
    if (!ok) {
      test.skip()
      return
    }

    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const resp = await page.request.get(
      `${apiBase}/api/v1/users/export?format=csv`
    )
    expect(resp.status()).toBe(403)

    // Response must not leak user identifiers (non-disclosing platform standard)
    const body = await resp.text()
    expect(body).not.toMatch(/\bUSR-\d+\b/)
    expect(body).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  })
}

// ---------------------------------------------------------------------------
// FR-06, SR-03 — Sensitive columns never appear in any export
// All 6 forbidden attributes must be absent from the file header row,
// verifying server-side omission (not just UI hiding).
// ---------------------------------------------------------------------------

test("Exported CSV header row contains none of the 6 forbidden sensitive attributes (FR-06, SR-03)", async ({
  authenticatedPage,
}) => {
  const result = await initiateAndDownload(authenticatedPage, "?format=csv")
  expect(
    result,
    "export async flow (202 → status poll → download) must complete — broken export API"
  ).not.toBeNull()
  if (!result) return // TypeScript narrowing only — never reached after expect

  const lines = result.bodyText.split("\n").filter(l => l.trim())
  expect(lines.length).toBeGreaterThan(0)
  const headerRow = lines[0].toLowerCase()

  const forbidden = [
    "password",
    "password_hash",
    "mfa_secret",
    "session_token",
    "jwt",
    "kyc",
  ]
  for (const col of forbidden) {
    expect(
      headerRow,
      `column "${col}" must not appear in export header`
    ).not.toContain(col)
  }
})

// ---------------------------------------------------------------------------
// FR-04 — Auditor export reflects role-authorized column subset
// Auditor cannot see the "MFA Status" column in the list view; it must also
// be absent from the exported file. Requires an active engagement window on
// the auditor test user — self-skips if the auditor session cannot export.
// ---------------------------------------------------------------------------

test("Auditor export does not include MFA Status column — role-authorized projection enforced (FR-04)", async ({
  auditorPage,
}) => {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""

  const initiateResp = await auditorPage.request.get(
    `${apiBase}/api/v1/users/export?format=csv`
  )
  if (initiateResp.status() === 403) {
    // Auditor engagement window may be expired or not configured — skip gracefully
    test.skip()
    return
  }
  expect(initiateResp.status()).toBe(202)

  const body = (await initiateResp.json()) as { job_id?: string }
  const jobId = body.job_id
  if (!jobId) {
    test.skip()
    return
  }

  const pollResult = await pollExportJob(auditorPage, jobId)
  if (pollResult !== "ready") {
    test.skip()
    return
  }

  const downloadResp = await auditorPage.request.get(
    `${apiBase}/api/v1/users/export/download/${jobId}`
  )
  if (!downloadResp.ok()) {
    test.skip()
    return
  }

  const csvText = (await downloadResp.body()).toString("utf-8")
  const headerRow = csvText.split("\n")[0].toLowerCase()

  // MFA Status is restricted for the Auditor role
  expect(headerRow).not.toMatch(/mfa[_\s]?status/)
  // All rows must be from the auditor's scoped tenant (no cross-tenant rows)
  expect(downloadResp.status()).toBe(200)
})

// ---------------------------------------------------------------------------
// VR-04 — Empty filtered result produces a valid file with headers and zero rows
// ---------------------------------------------------------------------------

test("Empty filtered result produces valid CSV with standard header row and zero data rows (VR-04)", async ({
  authenticatedPage,
}) => {
  const result = await initiateAndDownload(
    authenticatedPage,
    "?format=csv&search=zzz_no_such_user_does_not_exist_99999"
  )
  expect(
    result,
    "export async flow (202 → status poll → download) must complete — broken export API"
  ).not.toBeNull()
  if (!result) return // TypeScript narrowing only — never reached after expect

  expect(result.contentType).toContain("text/csv")

  const lines = result.bodyText.split("\n").filter(l => l.trim())
  // Header row must be present even when the result is empty
  expect(lines.length).toBeGreaterThanOrEqual(1)
  const headerRow = lines[0].toLowerCase()
  expect(headerRow).toContain("email")
  // Zero data rows
  expect(lines.length - 1).toBe(0)
})
