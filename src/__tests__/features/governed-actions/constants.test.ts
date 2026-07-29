import { describe, it, expect } from "vitest"
import {
  canReviewGovernedAction,
  GOVERNED_ACTION_LIST_ALLOWED_ROLES,
} from "@/features/governed-actions/constants"

describe("canReviewGovernedAction", () => {
  it("allows back_office to review partner_confirm", () => {
    expect(canReviewGovernedAction("partner_confirm", "back_office")).toBe(true)
  })

  it("does not allow system_admin to review partner_confirm", () => {
    expect(canReviewGovernedAction("partner_confirm", "system_admin")).toBe(
      false
    )
  })

  it("does not allow back_office to review partner_archive-adjacent platform actions", () => {
    expect(canReviewGovernedAction("tenant_create", "back_office")).toBe(false)
  })

  it("allows system_admin to review platform-level action types", () => {
    expect(canReviewGovernedAction("tenant_create", "system_admin")).toBe(true)
    expect(canReviewGovernedAction("user_role_change", "system_admin")).toBe(
      true
    )
  })

  it("allows back_office to review all tenant-level partner action types", () => {
    const partnerActionTypes = [
      "partner_archive",
      "partner_confirm",
      "partner_role_assign",
      "partner_identity_change",
      "partner_merge",
    ] as const
    for (const actionType of partnerActionTypes) {
      expect(canReviewGovernedAction(actionType, "back_office")).toBe(true)
      expect(canReviewGovernedAction(actionType, "system_admin")).toBe(false)
    }
  })

  it("returns false when role is undefined", () => {
    expect(canReviewGovernedAction("partner_confirm", undefined)).toBe(false)
  })
})

describe("GOVERNED_ACTION_LIST_ALLOWED_ROLES", () => {
  // Mirrors refinext-api's permission matrix: front_office holds no
  // governed_action:* permission, so it must never reach the pending-approvals
  // screen — it would only ever get a 403 error state (PRD1042-1496).
  it("excludes front_office", () => {
    expect(GOVERNED_ACTION_LIST_ALLOWED_ROLES).not.toContain("front_office")
  })

  it("excludes leasing_company_user", () => {
    expect(GOVERNED_ACTION_LIST_ALLOWED_ROLES).not.toContain(
      "leasing_company_user"
    )
  })

  it("includes the five roles that hold governed_action:list", () => {
    expect([...GOVERNED_ACTION_LIST_ALLOWED_ROLES].sort()).toEqual([
      "auditor",
      "back_office",
      "bank_power_user",
      "support_user",
      "system_admin",
    ])
  })
})
