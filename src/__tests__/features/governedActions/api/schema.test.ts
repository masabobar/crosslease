import { describe, it, expect } from "vitest"
import {
  GovernedActionSchema,
  GovernedActionStatusSchema,
  GovernedActionTypeSchema,
  PaginatedGovernedActionsSchema,
  RoleChangeSnapshotSchema,
  ReviewCommentFormSchema,
  REVIEW_COMMENT_MIN_LENGTH,
  displaySnapshot,
  roleChangeSnapshot,
  emailChangeSnapshot,
  initiatorSnapshot,
  approverSnapshot,
} from "@/features/governedActions/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"

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
      "partner_archive",
      "partner_confirm",
      "partner_role_assign",
      "partner_identity_change",
      "partner_merge",
      "product_template_activate",
      "product_template_deprecate",
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

  it("accepts a non-UUID subject_id (e.g. module code for module_activate)", () => {
    const result = GovernedActionSchema.parse({
      ...VALID_ACTION,
      action_type: "module_activate",
      subject_type: "module",
      subject_id: "financing",
    })
    expect(result.subject_id).toBe("financing")
  })
})

describe("display_snapshot accessors (safeParse, not a blind cast)", () => {
  it("parses matching fields from display_snapshot", () => {
    const action = {
      ...VALID_ACTION,
      display_snapshot: {
        user_id: "u-1",
        affected_user_email: "jane@example.com",
        old_role: "auditor",
        new_role: "system_admin",
      },
    } as GovernedAction
    const snap = roleChangeSnapshot(action)
    expect(snap.affected_user_email).toBe("jane@example.com")
    expect(snap.old_role).toBe("auditor")
    expect(snap.new_role).toBe("system_admin")
  })

  it("falls back to an empty object when a field has the wrong type", () => {
    const action = {
      ...VALID_ACTION,
      // old_role sent as a number instead of a string — malformed BE data
      display_snapshot: { old_role: 123, new_role: "system_admin" },
    } as unknown as GovernedAction
    const snap = roleChangeSnapshot(action)
    expect(snap).toEqual({})
  })

  it("falls back to an empty object when display_snapshot is missing fields entirely", () => {
    const action = { ...VALID_ACTION, display_snapshot: {} } as GovernedAction
    const snap = roleChangeSnapshot(action)
    expect(snap.old_role).toBeUndefined()
    expect(snap.new_role).toBeUndefined()
  })

  it("emailChangeSnapshot rejects wrong-typed fields the same way", () => {
    const action = {
      ...VALID_ACTION,
      display_snapshot: { old_email: 42, new_email: "new@example.com" },
    } as unknown as GovernedAction
    expect(emailChangeSnapshot(action)).toEqual({})
  })

  it("displaySnapshot generic helper validates against the given schema", () => {
    const validAction = {
      ...VALID_ACTION,
      display_snapshot: { old_role: "auditor", new_role: "system_admin" },
    } as GovernedAction
    expect(
      displaySnapshot(validAction, RoleChangeSnapshotSchema).old_role
    ).toBe("auditor")

    const malformedAction = {
      ...VALID_ACTION,
      display_snapshot: { old_role: { nested: true } },
    } as unknown as GovernedAction
    expect(displaySnapshot(malformedAction, RoleChangeSnapshotSchema)).toEqual(
      {}
    )
  })
})

describe("initiator_snapshot / approver_snapshot validation", () => {
  it("accepts a snapshot missing individual fields", () => {
    const result = GovernedActionSchema.parse({
      ...VALID_ACTION,
      initiator_snapshot: { user_id: "USR-00001" },
    })
    expect(initiatorSnapshot(result).first_name).toBeUndefined()
  })

  it("throws when a snapshot field has the wrong type", () => {
    expect(() =>
      GovernedActionSchema.parse({
        ...VALID_ACTION,
        initiator_snapshot: {
          ...VALID_ACTION.initiator_snapshot,
          first_name: 42,
        },
      })
    ).toThrow()
  })

  it("accepts a null approver_snapshot and returns null via the accessor", () => {
    const result = GovernedActionSchema.parse(VALID_ACTION)
    expect(approverSnapshot(result)).toBeNull()
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

describe("ReviewCommentFormSchema", () => {
  it("accepts an empty comment (optional for approval)", () => {
    expect(ReviewCommentFormSchema.parse({ comment: "" }).comment).toBe("")
  })

  it("accepts a whitespace-only comment (treated as empty)", () => {
    expect(ReviewCommentFormSchema.parse({ comment: "   " }).comment).toBe(
      "   "
    )
  })

  it(`accepts a comment at least ${REVIEW_COMMENT_MIN_LENGTH} characters long`, () => {
    const comment = "a".repeat(REVIEW_COMMENT_MIN_LENGTH)
    expect(ReviewCommentFormSchema.parse({ comment }).comment).toBe(comment)
  })

  it("rejects a non-empty comment shorter than the minimum length", () => {
    const comment = "a".repeat(REVIEW_COMMENT_MIN_LENGTH - 1)
    expect(() => ReviewCommentFormSchema.parse({ comment })).toThrow()
  })

  it("throws when comment field is missing", () => {
    expect(() => ReviewCommentFormSchema.parse({})).toThrow()
  })
})
