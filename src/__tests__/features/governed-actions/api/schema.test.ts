import { describe, it, expect } from "vitest"
import {
  GovernedActionSchema,
  GovernedActionStatusSchema,
  GovernedActionTypeSchema,
  PaginatedGovernedActionsSchema,
} from "@/features/governed-actions/api/schema"

const VALID_ACTION = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action_type: "user_role_change",
  subject_type: "user",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  tenant_id: null,
  status: "pending",
  initiator_id: "550e8400-e29b-41d4-a716-446655440002",
  approver_id: null,
  display_snapshot: {
    user_id: "550e8400-e29b-41d4-a716-446655440003",
    old_role: "auditor",
    new_role: "system_admin",
  },
  initiator_snapshot: {
    user_id: "USR-00001",
    first_name: "Jane",
    last_name: "Doe",
    role: "system_admin",
    tenant_id: null,
  },
  approver_snapshot: null,
  execution_params: {},
  reason: "Promotion",
  approver_comment: null,
  expires_at: null,
  resolved_at: null,
  correlation_id: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
}

describe("GovernedActionStatusSchema", () => {
  it("accepts valid statuses", () => {
    for (const s of [
      "pending",
      "approved",
      "rejected",
      "withdrawn",
      "expired",
    ] as const) {
      expect(GovernedActionStatusSchema.parse(s)).toBe(s)
    }
  })

  it("rejects unknown status", () => {
    expect(() => GovernedActionStatusSchema.parse("active")).toThrow()
  })
})

describe("GovernedActionTypeSchema", () => {
  it("accepts valid types", () => {
    for (const t of [
      "tenant_create",
      "user_platform_invite",
      "user_role_change",
      "user_auditor_period_update",
      "user_email_change",
    ] as const) {
      expect(GovernedActionTypeSchema.parse(t)).toBe(t)
    }
  })

  it("rejects unknown type", () => {
    expect(() => GovernedActionTypeSchema.parse("delete_user")).toThrow()
  })
})

describe("GovernedActionSchema", () => {
  it("parses a valid action", () => {
    const result = GovernedActionSchema.parse(VALID_ACTION)
    expect(result.id).toBe(VALID_ACTION.id)
    expect(result.status).toBe("pending")
    expect(result.action_type).toBe("user_role_change")
  })

  it("throws on missing required field (id)", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...withoutId } = VALID_ACTION
    expect(() => GovernedActionSchema.parse(withoutId)).toThrow()
  })

  it("throws on missing required field (action_type)", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { action_type, ...withoutType } = VALID_ACTION
    expect(() => GovernedActionSchema.parse(withoutType)).toThrow()
  })

  it("throws on invalid status enum", () => {
    expect(() =>
      GovernedActionSchema.parse({ ...VALID_ACTION, status: "unknown_status" })
    ).toThrow()
  })

  it("throws on invalid action_type enum", () => {
    expect(() =>
      GovernedActionSchema.parse({ ...VALID_ACTION, action_type: "bad_type" })
    ).toThrow()
  })

  it("accepts nullable fields as null", () => {
    const result = GovernedActionSchema.parse(VALID_ACTION)
    expect(result.approver_id).toBeNull()
    expect(result.tenant_id).toBeNull()
    expect(result.approver_snapshot).toBeNull()
  })
})

describe("PaginatedGovernedActionsSchema", () => {
  it("parses a paginated response", () => {
    const result = PaginatedGovernedActionsSchema.parse({
      actions: [VALID_ACTION],
      total: 1,
      page: 1,
      per_page: 20,
      total_pages: 1,
    })
    expect(result.actions).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it("throws on missing total field", () => {
    expect(() =>
      PaginatedGovernedActionsSchema.parse({
        actions: [VALID_ACTION],
        page: 1,
        per_page: 20,
        total_pages: 1,
      })
    ).toThrow()
  })
})
