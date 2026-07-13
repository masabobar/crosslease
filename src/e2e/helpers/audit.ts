import { expect } from "../fixtures/test"
import type { Page } from "../fixtures/test"
import {
  AuditReceptionPage,
  type AuditEventListItem,
  type AuditListQuery,
} from "../pages/AuditReceptionPage"

// ---------------------------------------------------------------------------
// Shared audit-assertion helper used by any spec that needs to verify a
// governed action produced an audit event.
//
// Response envelope for GET /api/v1/audit/events (verified 2026-07-13 via
// diagnostic probe):
//   { events: AuditEventListItem[], total, page, per_page, total_pages }
//
// The key is `events`, not `items`. Any spec that reads the audit list must
// go through here to avoid re-introducing envelope-shape drift.
// ---------------------------------------------------------------------------

interface AuditListResponse {
  events?: AuditEventListItem[]
  total?: number
}

// Extract events[] from a raw response body defensively — treat missing /
// non-array as "no events yet" so a polling caller keeps retrying rather than
// crashing on a TypeError.
function extractEvents(body: unknown): AuditEventListItem[] {
  if (!body || typeof body !== "object") return []
  const events = (body as AuditListResponse).events
  return Array.isArray(events) ? events : []
}

// Poll GET /api/v1/audit/events with the given filter until the first matching
// event is observed, or the deadline elapses. Returns the matched event, or
// null on timeout. Never throws for the shape of the response body.
export async function waitForAuditEvent(
  auditorPage: Page,
  filter: AuditListQuery,
  timeoutMs: number = 15_000
): Promise<AuditEventListItem | null> {
  const audit = new AuditReceptionPage(auditorPage)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await audit.listEvents({ per_page: 50, ...filter })
    if (response.ok()) {
      const events = extractEvents(await response.json())
      if (events.length > 0) return events[0]
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return null
}

// Resolve the current user's principal_id via GET /api/v1/users/me. Used to
// scope post-action audit-event assertions by actor. Returns null on any
// failure so the audit assertion can be conditionally skipped rather than
// crashing the whole test. The BE envelope has been observed in two shapes:
// { data: { id } } (documented) and { id } (some paths) — support both.
export async function getPrincipalId(page: Page): Promise<string | null> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const resp = await page.request.get(`${apiBase}/api/v1/users/me`, {
    failOnStatusCode: false,
  })
  if (!resp.ok()) return null
  const body = (await resp.json()) as { data?: { id?: string }; id?: string }
  return body.data?.id ?? body.id ?? null
}

// Convenience wrapper that asserts an event WAS recorded — used by
// User Management specs that append an audit check after a governed action.
// Includes the filter values in the failure message so the diagnostic points
// at the specific action that didn't emit.
export async function expectAuditEvent(
  auditorPage: Page,
  filter: AuditListQuery,
  options: { timeoutMs?: number; message?: string } = {}
): Promise<AuditEventListItem> {
  const timeoutMs = options.timeoutMs ?? 15_000
  const record = await waitForAuditEvent(auditorPage, filter, timeoutMs)
  const filterDescription = Object.entries(filter)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(" ")
  expect(
    record,
    options.message ??
      `no audit event recorded within ${timeoutMs}ms matching ${filterDescription}`
  ).not.toBeNull()
  return record as AuditEventListItem
}
