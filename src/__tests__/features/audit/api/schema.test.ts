import { describe, it, expect } from "vitest"
import {
  AuditEventSchema,
  AuditFilterOptionsSchema,
  PaginatedAuditEventsSchema,
  deriveAuditResult,
} from "@/features/audit/api/schema"

const validAuditEvent = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  audit_seq: 1001,
  entity_type: "user",
  entity_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  entity_display: "Anna Müller",
  action_type: "state_transition",
  event_type: "user.suspended",
  actor_id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  actor_display: "Klaus Bauer",
  actor_type: "human_user",
  actor_role_at_time: "system_admin",
  old_data: null,
  new_data: null,
  changed_fields: null,
  trigger_source: "manual",
  reason: "security_concern",
  comment: null,
  tenant_id: null,
  correlation_id: null,
  session_id: null,
  payload: null,
  sensitive: false,
  recorded_at: "2026-06-08T10:00:00Z",
}

describe("AuditEventSchema", () => {
  it("accepts a valid audit event", () => {
    expect(() => AuditEventSchema.parse(validAuditEvent)).not.toThrow()
  })

  it("preserves actor_role_at_time in parsed output", () => {
    const parsed = AuditEventSchema.parse(validAuditEvent)
    expect(parsed.actor_role_at_time).toBe("system_admin")
  })

  it("accepts null actor_role_at_time", () => {
    expect(() =>
      AuditEventSchema.parse({ ...validAuditEvent, actor_role_at_time: null })
    ).not.toThrow()
  })

  it("accepts null values for all nullable fields", () => {
    const event = {
      ...validAuditEvent,
      entity_id: null,
      entity_display: null,
      actor_role_at_time: null,
      old_data: null,
      new_data: null,
      changed_fields: null,
      trigger_source: null,
      reason: null,
      comment: null,
      tenant_id: null,
      correlation_id: null,
      session_id: null,
      payload: null,
    }
    expect(() => AuditEventSchema.parse(event)).not.toThrow()
  })

  it("rejects missing required fields", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { event_type: _omit, ...rest } = validAuditEvent
    expect(() => AuditEventSchema.parse(rest)).toThrow()
  })

  it("rejects invalid id format", () => {
    expect(() =>
      AuditEventSchema.parse({ ...validAuditEvent, id: "not-a-uuid" })
    ).toThrow()
  })

  it("rejects non-boolean sensitive", () => {
    expect(() =>
      AuditEventSchema.parse({ ...validAuditEvent, sensitive: "true" })
    ).toThrow()
  })

  it("accepts object payload with nested data", () => {
    const event = {
      ...validAuditEvent,
      payload: { retention_category: "standard", request_trace: "abc123" },
    }
    const parsed = AuditEventSchema.parse(event)
    expect(parsed.payload?.retention_category).toBe("standard")
  })
})

describe("PaginatedAuditEventsSchema", () => {
  it("accepts a valid paginated response", () => {
    const payload = {
      events: [validAuditEvent],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    }
    expect(() => PaginatedAuditEventsSchema.parse(payload)).not.toThrow()
  })

  it("accepts an empty events array", () => {
    const payload = {
      events: [],
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0,
    }
    expect(() => PaginatedAuditEventsSchema.parse(payload)).not.toThrow()
  })

  it("rejects missing total field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { total: _omit, ...rest } = {
      events: [validAuditEvent],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    }
    expect(() => PaginatedAuditEventsSchema.parse(rest)).toThrow()
  })
})

describe("AuditFilterOptionsSchema", () => {
  const validOptions = {
    entity_types: ["user", "contract", "document"],
    action_types: ["create", "update", "state_transition"],
    actor_types: ["human_user", "system"],
    trigger_sources: ["manual", "scheduled_job"],
    event_types: ["user.suspended", "auth.login_failed"],
  }

  it("accepts a valid filter options response", () => {
    expect(() => AuditFilterOptionsSchema.parse(validOptions)).not.toThrow()
  })

  it("accepts empty arrays for all list fields", () => {
    const empty = {
      entity_types: [],
      action_types: [],
      actor_types: [],
      trigger_sources: [],
      event_types: [],
    }
    expect(() => AuditFilterOptionsSchema.parse(empty)).not.toThrow()
  })

  it("rejects missing entity_types field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { entity_types: _omit, ...rest } = validOptions
    expect(() => AuditFilterOptionsSchema.parse(rest)).toThrow()
  })

  it("rejects non-array values", () => {
    expect(() =>
      AuditFilterOptionsSchema.parse({ ...validOptions, entity_types: "user" })
    ).toThrow()
  })
})

describe("deriveAuditResult", () => {
  it("returns Success for a standard event", () => {
    expect(deriveAuditResult("user.suspended")).toBe("Success")
    expect(deriveAuditResult("user.invited")).toBe("Success")
    expect(deriveAuditResult("user.role_changed")).toBe("Success")
    expect(deriveAuditResult("auth.login")).toBe("Success")
  })

  it("returns Failed for events containing _failed", () => {
    expect(deriveAuditResult("auth.login_failed")).toBe("Failed")
  })

  it("returns Failed for events containing _denied", () => {
    expect(deriveAuditResult("security.permission_denied")).toBe("Failed")
    expect(deriveAuditResult("access.request_denied")).toBe("Failed")
  })

  it("returns Failed for events containing _rejected without an action_type", () => {
    expect(deriveAuditResult("user.invite_rejected")).toBe("Failed")
  })

  it("returns Failed for events containing _violation", () => {
    expect(deriveAuditResult("security.cross_tenant_violation")).toBe("Failed")
  })

  it("is case-insensitive", () => {
    expect(deriveAuditResult("AUTH.LOGIN_FAILED")).toBe("Failed")
    expect(deriveAuditResult("AUTH.LOGIN_SUCCEEDED")).toBe("Success")
  })

  it("returns Success for a governed-action rejection (state_transition)", () => {
    expect(
      deriveAuditResult("tenant.create_rejected", "state_transition")
    ).toBe("Success")
    expect(deriveAuditResult("user.invite_rejected", "state_transition")).toBe(
      "Success"
    )
    expect(
      deriveAuditResult("partner.identity_change_rejected", "state_transition")
    ).toBe("Success")
  })

  it("still returns Success for a plain state_transition event without the suffix guard", () => {
    expect(deriveAuditResult("tenant.suspended", "state_transition")).toBe(
      "Success"
    )
  })

  it("keeps non-governed _rejected/_violation events Failed regardless of action_type", () => {
    expect(deriveAuditResult("auth.login_failed", "access")).toBe("Failed")
    expect(deriveAuditResult("security.permission_denied", "access")).toBe(
      "Failed"
    )
    expect(
      deriveAuditResult(
        "product_template.immutability_violation_attempted",
        "update"
      )
    ).toBe("Failed")
  })
})
