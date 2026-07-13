import { expect, test } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import { waitForAuditEvent } from "../../helpers/audit"
import type { Page } from "../../fixtures/test"
import {
  AuditReceptionPage,
  type AuditEventListItem,
} from "../../pages/AuditReceptionPage"

// ---------------------------------------------------------------------------
// PRD1042-779 — US 26.2 | AUDIT TRAIL | Audit Event Reception & Validation
// Gherkin source: src/e2e/tests/PRD1042-37-Audit Trail/
//                 PRD1042-779 Audit Event Reception & Validation.md
//
// Scenarios generated (✅ in E2E column):
//   - AC-FR-01, AC-FR-02  Governed action emits audit event (Scenario Outline)
//   - AC-FR-02            Server-assigned timestamp + Unified Event Model fields
//   - AC-SR-01            POST /audit/events not exposed to operational roles
//
// Scenarios skipped entirely (⚙️ needs D20 — dependency-blocked):
//   - AC-SB-03, AC-AR-01  Cross-tenant read + CROSS_TENANT_WRITE_BLOCKED
//   - AC-AR-01            Immutability + Auditor+Compliance-only visibility
//
// Additional exclusion filters (per generation instruction):
//   1. bank_admin role rows removed from every Scenario Outline
//      (no E2E_BANK_ADMIN_* env credentials seeded; unsupported).
//   2. Create / invite operations — none present in the ✅ set; no change.
//   3. Deactivate / suspend operations — none present in the ✅ set; no change.
//
// Note: the reception endpoint `POST /audit/events` is internal service-to-
// service and NOT part of the public `/api/v1/*` surface — the RefiNext
// tenant-isolation constraint #5 requires 404 (not 403) for operational
// callers. The read path used for post-emit verification is
// `GET /api/v1/audit/events` (documented in openapi.json).
// ---------------------------------------------------------------------------

// Roles exercised by the happy-path Outline. bank_admin is excluded per filter.
const governedActionRoles = [
  { role: "system_admin", email: process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "" },
  {
    role: "front_office",
    email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
  },
  { role: "back_office", email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "" },
  { role: "support_user", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
  { role: "auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
]

// Roles exercised by AC-SR-01 reception-not-exposed Outline. bank_admin is
// excluded per filter; the LC user is included because AC-SR-01 explicitly
// covers "operational roles or LC".
const receptionUnauthorizedRoles = [
  { role: "system_admin", email: process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "" },
  {
    role: "front_office",
    email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
  },
  { role: "back_office", email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "" },
  { role: "support_user", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
  { role: "auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
  { role: "lc_user", email: process.env.E2E_LCO_USER_EMAIL ?? "" },
]

test.describe("PRD1042-779 — Audit Event Reception & Validation", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-FR-01, AC-FR-02
  // Every governed operational-role login synchronously emits an audit event
  // observable on the auditor read path. Each iteration:
  //   1. Records the T0 timestamp before login
  //   2. Logs in the role via /internal/test/session (bypasses OTP)
  //   3. Uses the auditor session to query /api/v1/audit/events for a
  //      login-family event recorded at/after T0
  //   4. Asserts core Unified Event Model fields on the returned record
  // -------------------------------------------------------------------------

  for (const { role, email } of governedActionRoles) {
    test(`${role} login emits audit event with Unified Event Model fields (AC-FR-01, AC-FR-02)`, async ({
      browser,
      auditorPage,
    }) => {
      test.skip(!email, `E2E credential for ${role} is not configured`)

      const t0 = new Date()

      // Perform the governed action — log the target role in via the
      // test-session bridge so we don't depend on OTP mailbox access.
      const actorContext = await browser.newContext()
      try {
        const actorPage = await actorContext.newPage()
        await createTestSession(actorPage, email)
      } finally {
        await actorContext.close()
      }

      // Read the audit trail as the seeded auditor (has cross-cockpit read).
      const record = await waitForAuditEvent(
        auditorPage,
        { actor_type: "human_user", from_dt: t0.toISOString() },
        20_000
      )

      // The record should have been persisted — if not, the sync-in-transaction
      // recording guarantee (AC-FR-01) is not being met.
      expect(
        record,
        `no audit record recorded for ${role} within 20s`
      ).not.toBeNull()

      if (!record) return

      // Unified Event Model — mandatory fields must all be present.
      expect.soft(typeof record.id).toBe("string")
      expect.soft(typeof record.audit_seq).toBe("number")
      expect.soft(typeof record.entity_type).toBe("string")
      expect.soft(typeof record.action_type).toBe("string")
      expect.soft(typeof record.event_type).toBe("string")
      expect.soft(typeof record.actor_id).toBe("string")
      expect.soft(typeof record.actor_type).toBe("string")
      expect.soft(typeof record.recorded_at).toBe("string")

      // Server-assigned timestamp — must fall within a plausible window from T0.
      const recordedAt = new Date(record.recorded_at).getTime()
      expect(recordedAt).toBeGreaterThanOrEqual(t0.getTime() - 1_000)
      expect(recordedAt).toBeLessThanOrEqual(Date.now() + 1_000)

      // actor_type closed enumeration (per openapi: human_user | system |
      // anonymous | scheduled_job). Login as a human user must produce
      // human_user (or, if the emitting service uses the older 'manual_user'
      // vocabulary, accept that too — the story's Gherkin uses manual_user).
      expect(["human_user", "manual_user"]).toContain(record.actor_type)
    })
  }

  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-FR-02 (server-assigned timestamp + Unified Event Model)
  // Client CANNOT influence the timestamp; server assigns it. All mandatory
  // Unified Event Model fields must be present on the persisted record.
  // -------------------------------------------------------------------------

  test("Audit event carries server-assigned timestamp and Unified Event Model fields (AC-FR-02)", async ({
    browser,
    auditorPage,
  }) => {
    const email = process.env.E2E_SYSTEM_ADMIN_EMAIL ?? ""
    test.skip(!email, "E2E_SYSTEM_ADMIN_EMAIL is not configured")

    const t0 = new Date()

    // Governed action — system_admin login via /internal/test/session.
    const actorContext = await browser.newContext()
    try {
      const actorPage: Page = await actorContext.newPage()
      await createTestSession(actorPage, email)
    } finally {
      await actorContext.close()
    }

    const record = await waitForAuditEvent(
      auditorPage,
      { actor_type: "human_user", from_dt: t0.toISOString() },
      20_000
    )

    expect(record, "no audit record recorded within 20s").not.toBeNull()
    if (!record) return

    // Every mandatory Unified Event Model field must be non-nullable / present.
    const mandatoryFields: Array<keyof AuditEventListItem> = [
      "id",
      "audit_seq",
      "entity_type",
      "action_type",
      "event_type",
      "actor_id",
      "actor_type",
      "sensitive",
      "recorded_at",
    ]
    for (const field of mandatoryFields) {
      expect
        .soft(record[field], `field ${String(field)} must be present`)
        .not.toBeUndefined()
      expect
        .soft(record[field], `field ${String(field)} must be non-null`)
        .not.toBeNull()
    }

    // Server-assigned timestamp — within 20s of the governed action window.
    const recordedAt = new Date(record.recorded_at).getTime()
    expect(recordedAt).toBeGreaterThanOrEqual(t0.getTime() - 1_000)
    expect(recordedAt).toBeLessThanOrEqual(t0.getTime() + 20_000)

    // actor_type from closed enumeration.
    expect([
      "human_user",
      "system",
      "anonymous",
      "scheduled_job",
      "manual_user",
      "system_scheduler",
      "integration_callback",
      "system_lifecycle",
      "migration",
    ]).toContain(record.actor_type)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-SR-01 (reception endpoint not exposed to operational users)
  // POST /audit/events is internal service-to-service. Every operational role
  // and the LC user role MUST receive 404 (not 403) per tenant-isolation
  // constraint #5. Response body must NOT indicate the endpoint exists.
  // -------------------------------------------------------------------------

  for (const { role, email } of receptionUnauthorizedRoles) {
    test(`${role} POST /audit/events returns 404 — reception endpoint not exposed (AC-SR-01)`, async ({
      browser,
    }) => {
      test.skip(!email, `E2E credential for ${role} is not configured`)

      const context = await browser.newContext()
      try {
        const page = await context.newPage()
        await createTestSession(page, email)

        const audit = new AuditReceptionPage(page)
        const response = await audit.probeReceptionEndpoint({
          entity_type: "user",
          action_type: "access",
          event_type: "test.probe",
          actor_type: "human_user",
          correlation_id: "e2e-audit-sr-01-probe",
        })

        expect(response.status()).toBe(404)

        // Body must not reveal endpoint existence via method-not-allowed style
        // hints. Anything containing "method not allowed" or a schema for the
        // reception payload would leak the endpoint's presence.
        const bodyText = await response.text()
        expect(bodyText.toLowerCase()).not.toContain("method not allowed")
        expect(bodyText.toLowerCase()).not.toContain(
          "/audit/events not accepted"
        )

        // Sanity: probing must never persist an audit record on the
        // operational user's behalf. Use the same session to try to fetch any
        // event with the probe's correlation_id — a 4xx here is the tenant
        // -isolated read path denying the operational role (system_admin has
        // access, so we only assert non-persistence for that role via absence).
        if (role === "system_admin") {
          const searchResponse = await audit.listEvents({
            event_type: "test.probe",
            per_page: 5,
          })
          if (searchResponse.ok()) {
            const body = (await searchResponse.json()) as {
              events?: Array<{ event_type: string }>
            }
            const events = Array.isArray(body?.events) ? body.events : []
            expect(
              events.filter(item => item.event_type === "test.probe")
            ).toHaveLength(0)
          }
        }
      } finally {
        await context.close()
      }
    })
  }
})
