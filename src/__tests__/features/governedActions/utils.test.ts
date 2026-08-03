import { describe, it, expect } from "vitest"
import { getGovernedActionSubject } from "@/features/governedActions/utils"
import type { GovernedAction } from "@/features/governedActions/api/schema"

const BASE_ACTION = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action_type: "user_role_change",
  subject_type: "user",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  tenant_id: null,
  status: "pending",
  initiator_id: "550e8400-e29b-41d4-a716-446655440002",
  approver_id: null,
  display_snapshot: {},
  initiator_snapshot: {
    user_id: "USR-00001",
    first_name: "Jane",
    last_name: "Doe",
    role: "system_admin",
    tenant_id: null,
  },
  approver_snapshot: null,
  execution_params: {},
  reason: null,
  approver_comment: null,
  expires_at: null,
  resolved_at: null,
  correlation_id: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
} as const

function actionWith(
  action_type: GovernedAction["action_type"],
  display_snapshot: Record<string, unknown>
): GovernedAction {
  return { ...BASE_ACTION, action_type, display_snapshot } as GovernedAction
}

describe("getGovernedActionSubject", () => {
  it("resolves user_role_change to the affected user's email", () => {
    const subject = getGovernedActionSubject(
      actionWith("user_role_change", {
        affected_user_email: "jane@example.com",
      })
    )
    expect(subject).toEqual({ kind: "user", value: "jane@example.com" })
  })

  it("resolves user_platform_invite to the invitee's full name", () => {
    const subject = getGovernedActionSubject(
      actionWith("user_platform_invite", { full_name: "John Smith" })
    )
    expect(subject).toEqual({ kind: "user", value: "John Smith" })
  })

  it("resolves user_email_change to the old (identifying) email", () => {
    const subject = getGovernedActionSubject(
      actionWith("user_email_change", {
        old_email: "old@example.com",
        new_email: "new@example.com",
      })
    )
    expect(subject).toEqual({ kind: "user", value: "old@example.com" })
  })

  it("resolves user_auditor_period_update to the affected user id", () => {
    const subject = getGovernedActionSubject(
      actionWith("user_auditor_period_update", { user_id: "USR-00099" })
    )
    expect(subject).toEqual({ kind: "user", value: "USR-00099" })
  })

  it("resolves tenant_create to the new tenant's name", () => {
    const subject = getGovernedActionSubject(
      actionWith("tenant_create", { name: "Acme Bank" })
    )
    expect(subject).toEqual({ kind: "tenant", value: "Acme Bank" })
  })

  it.each(["tenant_suspend", "tenant_reactivate", "tenant_archive"] as const)(
    "resolves %s to the tenant id",
    action_type => {
      const subject = getGovernedActionSubject(
        actionWith(action_type, { tenant_id: "TEN-001" })
      )
      expect(subject).toEqual({ kind: "tenant", value: "TEN-001" })
    }
  )

  it("resolves module_activate to the module key", () => {
    const subject = getGovernedActionSubject(
      actionWith("module_activate", {
        tenant_id: "TEN-001",
        module_key: "financing",
      })
    )
    expect(subject).toEqual({ kind: "module", value: "financing" })
  })

  it("resolves partner_merge to the source partner id", () => {
    const subject = getGovernedActionSubject(
      actionWith("partner_merge", {
        source_partner_id: "PRT-001",
        target_partner_id: "PRT-002",
      })
    )
    expect(subject).toEqual({ kind: "partner", value: "PRT-001" })
  })

  it.each([
    "partner_archive",
    "partner_confirm",
    "partner_role_assign",
    "partner_identity_change",
  ] as const)("resolves %s to the partner id", action_type => {
    const subject = getGovernedActionSubject(
      actionWith(action_type, { partner_id: "PRT-009" })
    )
    expect(subject).toEqual({ kind: "partner", value: "PRT-009" })
  })

  it.each(["product_template_activate", "product_template_deprecate"] as const)(
    "resolves %s to the template name",
    action_type => {
      const subject = getGovernedActionSubject(
        actionWith(action_type, { template_name: "Standard Lease" })
      )
      expect(subject).toEqual({ kind: "template", value: "Standard Lease" })
    }
  )

  it("returns a null value when the expected field is absent", () => {
    const subject = getGovernedActionSubject(actionWith("user_role_change", {}))
    expect(subject).toEqual({ kind: "user", value: null })
  })
})
