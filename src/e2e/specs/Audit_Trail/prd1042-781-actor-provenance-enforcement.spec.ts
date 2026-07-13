import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import {
  AuditReceptionPage,
  type AuditEventListItem,
} from "../../pages/AuditReceptionPage"

// ---------------------------------------------------------------------------
// PRD1042-781 — US 26.4 | Audit Trail | Actor Provenance Enforcement &
//                                       Misattribution Prevention
// Gherkin source: src/e2e/tests/PRD1042-37-Audit Trail/
//                 PRD1042-781 Actor Provenance Enforcement.md
//
// SCENARIO STATUS (per source Scenarios summary table `E2E` column)
// -----------------------------------------------------------------
// AC-01  ⚙️ needs D-SystemHarness              → no test emitted
// AC-02  ⚙️ needs D-AuditQuery                 → no test emitted
// AC-03  ⚙️ needs D-AuditQuery + D-SystemHarness → no test emitted
// AC-05  ⚙️ needs D-SystemHarness              → no test emitted
// AC-06  ⚙️ needs D-AuditQuery                 → no test emitted
// AC-07  ⚙️ needs D-SystemHarness + D-AuditQuery → no test emitted
// AC-08  ⚙️ needs D-AuditQuery                 → no test emitted
// AC-10  ✅                                     → runnable test below
//
// Per the playwright-architect skill (SKILL.md §"Blocked scenario handling"):
// only rows with ✅ in the E2E column produce runnable test blocks. Rows with
// ⚙️ generate no test — not even test.fixme(). AC-09 and AC-11 are Blocked
// ACs (no Gherkin block exists) and therefore also produce no test.
//
// EXCLUSIONS APPLIED (per task instructions)
// ------------------------------------------
// - bank_admin role                : AC-10 uses Front Office user → not filtered
// - Create / invite operations     : AC-10 is not a create/invite action → not filtered
// - Deactivate / suspend operations: AC-10 is not a lifecycle action → not filtered
//
// Filtered scenarios: none — AC-10 (the only ✅ row) passes all three filters.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""

// Poll the audit list endpoint for a recent event since `since` matching the
// provided actor_id. Returns the first matching item or null on timeout.
async function waitForActorEvent(
  audit: AuditReceptionPage,
  actorId: string,
  since: Date,
  timeoutMs: number = 15_000
): Promise<AuditEventListItem | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await audit.listEvents({
      actor_id: actorId,
      from_dt: since.toISOString(),
      per_page: 50,
    })
    if (response.ok()) {
      const body = (await response.json()) as { items: AuditEventListItem[] }
      if (body.items.length > 0) return body.items[0]
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return null
}

test.describe("PRD1042-781 — Actor Provenance Enforcement", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-10 (server-authoritative provenance)
  // A client-supplied actor_type on an FE-controlled request MUST NOT be
  // honored — provenance validation is server-authoritative. Even a manual
  // user with valid credentials cannot inject a system actor_type into a
  // business action they initiate via the UI/API.
  //
  // Flow:
  //   1. Establish a Front Office session (creates baseline audit trail).
  //   2. Resolve the Front Office user's principal_id via GET /users/me.
  //   3. Submit a business action to the API with a client-supplied
  //      actor_type payload attempting to override server-assigned value.
  //   4. Use the auditor session to query the persisted audit record for
  //      that actor and verify actor_type is the human enum value
  //      (manual_user or human_user, per the current openapi enumeration)
  //      — NOT the client-supplied system_dd_counter value.
  // -------------------------------------------------------------------------

  test("Client-supplied actor_type on FE-controlled request cannot override server-assigned value (AC-10)", async ({
    browser,
    auditorPage,
  }) => {
    const foEmail = process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    test.skip(!foEmail, "E2E_FRONT_OFFICE_USER_EMAIL is not configured")

    const t0 = new Date()

    // Establish the Front Office session and resolve principal_id so we can
    // filter the audit trail by actor. The session-create call itself is a
    // governed business action that will produce an audit record with the
    // server-assigned actor_type.
    const actorContext = await browser.newContext()
    let ownId: string | undefined
    try {
      const actorPage = await actorContext.newPage()
      await createTestSession(actorPage, foEmail)

      // Attempt a business action with a client-supplied actor_type payload.
      // The server must ignore the client-supplied field. A profile update
      // via the /users/me endpoint is a realistic FE-controlled surface.
      const meResp = await actorPage.request.get(`${apiBase}/api/v1/users/me`)
      if (!meResp.ok()) {
        test.skip()
        return
      }
      const meBody = (await meResp.json()) as {
        data?: { id?: string }
        id?: string
      }
      ownId = meBody.data?.id ?? meBody.id
      if (!ownId) {
        test.skip()
        return
      }

      // Poison the payload with a system actor_type — this MUST be discarded
      // by the server. Any 2xx / 4xx response is acceptable for the purposes
      // of this assertion; the actual provenance check is on the persisted
      // audit record, not the immediate response body.
      await actorPage.request.patch(`${apiBase}/api/v1/users/${ownId}`, {
        data: {
          actor_type: "system_dd_counter",
          principal_id: "svc.hijacked",
        },
        failOnStatusCode: false,
      })
    } finally {
      await actorContext.close()
    }

    if (!ownId) {
      test.skip()
      return
    }

    // Read the audit trail using the seeded auditor session. The record for
    // this Front Office actor MUST carry a human actor_type (per the closed
    // enumeration), not the client-supplied system value.
    const audit = new AuditReceptionPage(auditorPage)
    const record = await waitForActorEvent(audit, ownId, t0, 20_000)

    expect(
      record,
      `no audit record recorded for actor ${ownId} within 20s`
    ).not.toBeNull()
    if (!record) return

    // Server-assigned actor_type must be the human enum member. Accept both
    // "manual_user" (per US 26.4 vocabulary) and "human_user" (per the
    // current openapi enumeration used by PRD1042-779).
    expect.soft(["manual_user", "human_user"]).toContain(record.actor_type)

    // The client-supplied system actor_type MUST NOT be persisted.
    expect.soft(record.actor_type).not.toBe("system_dd_counter")
    expect.soft(record.actor_type).not.toBe("system_scheduler")
    expect.soft(record.actor_type).not.toBe("system_propagation")
    expect.soft(record.actor_type).not.toBe("system_lifecycle")
    expect.soft(record.actor_type).not.toBe("integration_callback")
    expect.soft(record.actor_type).not.toBe("migration")

    // Actor identifier must be the human user's principal_id — the client
    // attempt to substitute a system service identity ("svc.hijacked") MUST
    // NOT have been honored.
    expect.soft(record.actor_id).toBe(ownId)
    expect.soft(record.actor_id).not.toBe("svc.hijacked")
  })
})
