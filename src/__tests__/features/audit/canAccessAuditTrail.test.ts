import { describe, it, expect } from "vitest"
import { canAccessAuditTrail } from "@/features/audit/types"

describe("canAccessAuditTrail", () => {
  it("returns true for system_admin", () => {
    expect(canAccessAuditTrail("system_admin")).toBe(true)
  })

  it("returns true for auditor", () => {
    expect(canAccessAuditTrail("auditor")).toBe(true)
  })

  it("returns true for bank_power_user", () => {
    expect(canAccessAuditTrail("bank_power_user")).toBe(true)
  })

  // PRD1042-1536 — BO users saw "View audit trail" actions, then hit 403
  it("returns false for back_office", () => {
    expect(canAccessAuditTrail("back_office")).toBe(false)
  })

  it("returns false for front_office", () => {
    expect(canAccessAuditTrail("front_office")).toBe(false)
  })

  it("returns false for support_user", () => {
    expect(canAccessAuditTrail("support_user")).toBe(false)
  })

  it("returns false for leasing_company_user", () => {
    expect(canAccessAuditTrail("leasing_company_user")).toBe(false)
  })

  it("returns false when role is undefined (user not loaded yet)", () => {
    expect(canAccessAuditTrail(undefined)).toBe(false)
  })
})
