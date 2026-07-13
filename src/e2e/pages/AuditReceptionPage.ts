import type { APIResponse, Page } from "../fixtures/test"

// ---------------------------------------------------------------------------
// AuditReceptionPage — API-only POM for PRD1042-779 (US 26.2).
//
// This story is backend service-to-service with no UI surface
// ("Frontend: None" per Architectural Notes). The POM therefore encapsulates
// HTTP interactions with the audit endpoints (`GET /api/v1/audit/events`,
// `GET /api/v1/audit/events/{id}`) plus a probe of the internal reception
// endpoint (`POST /audit/events`) used to verify AC-SR-01 (not exposed to
// operational roles).
//
// Distinct from `AuditTrailPage`, which owns the operational UI surface for
// PRD1042-782 (US 26.5 investigation views).
//
// No assertions live inside this class — the spec makes assertions on the
// values returned by these methods.
// ---------------------------------------------------------------------------

export interface AuditEventListItem {
  id: string
  audit_seq: number
  entity_type: string
  entity_id: string | null
  entity_display: string | null
  action_type: string
  event_type: string
  actor_id: string
  actor_type: string
  actor_display: string | null
  actor_role_at_time: string | null
  trigger_source: string | null
  sensitive: boolean
  tenant_id: string | null
  recorded_at: string
}

export interface PaginatedAuditEvents {
  items: AuditEventListItem[]
  total: number
  page: number
  per_page: number
}

export interface AuditListQuery {
  entity_type?: string
  action_type?: string
  event_type?: string
  entity_id?: string
  actor_id?: string
  actor_type?: string
  trigger_source?: string
  sensitive?: boolean
  from_dt?: string
  to_dt?: string
  page?: number
  per_page?: number
}

export class AuditReceptionPage {
  readonly page: Page
  readonly apiBase: string

  constructor(page: Page) {
    this.page = page
    this.apiBase = process.env.E2E_API_BASE_URL ?? ""
  }

  // Sends a raw POST to the internal reception endpoint. Used by AC-SR-01
  // scenarios to verify that operational roles receive 404. Returns the
  // APIResponse so the spec can assert on the status code.
  async probeReceptionEndpoint(
    payload: Record<string, unknown> = {}
  ): Promise<APIResponse> {
    return this.page.request.post(`${this.apiBase}/audit/events`, {
      data: payload,
      failOnStatusCode: false,
    })
  }

  // GET /api/v1/audit/events with the provided query parameters. Returns the
  // raw APIResponse so the spec can distinguish 200 (authorised) from 4xx
  // (denied / tenant-scoped miss).
  async listEvents(query: AuditListQuery = {}): Promise<APIResponse> {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      params[key] = String(value)
    }
    return this.page.request.get(`${this.apiBase}/api/v1/audit/events`, {
      params,
      failOnStatusCode: false,
    })
  }

  // Convenience wrapper: parse a successful list response and return items.
  async listEventsJson(
    query: AuditListQuery = {}
  ): Promise<PaginatedAuditEvents> {
    const response = await this.listEvents(query)
    if (!response.ok()) {
      throw new Error(
        `GET /api/v1/audit/events failed: ${response.status()} ${response.statusText()}`
      )
    }
    return (await response.json()) as PaginatedAuditEvents
  }
}
