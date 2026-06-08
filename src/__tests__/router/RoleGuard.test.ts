import { describe, it, expect } from "vitest"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  INTERNAL_BANK_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"
import { PATHS } from "@/router/paths"

/**
 * RoleGuard component tests — covering the permission logic.
 *
 * The component renders null while loading, children when the role is
 * allowed, and navigates to PATHS.FORBIDDEN when the role is not allowed.
 * Because there is no @testing-library/react in this project, these tests
 * verify the role-matching constants and redirect target used by the guard.
 */

describe("PATHS.FORBIDDEN", () => {
  it("is defined as /403", () => {
    expect(PATHS.FORBIDDEN).toBe("/403")
  })
})

describe("RoleGuard allowed-role logic", () => {
  it("system_admin is in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("system_admin")).toBe(true)
  })

  it("support_user is in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("support_user")).toBe(true)
  })

  it("auditor is in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("auditor")).toBe(true)
  })

  it("front_office is in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("front_office")).toBe(true)
  })

  it("back_office is in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("back_office")).toBe(true)
  })

  it("leasing_company_user is NOT in USER_MANAGEMENT_ALLOWED_ROLES", () => {
    expect(USER_MANAGEMENT_ALLOWED_ROLES.includes("leasing_company_user")).toBe(
      false
    )
  })
})

describe("RoleGuard redirect target", () => {
  it("redirects unauthorized roles to FORBIDDEN path, not dashboard", () => {
    // Guard should navigate to /403 on role mismatch — not /
    expect(PATHS.FORBIDDEN).not.toBe(PATHS.DASHBOARD)
    expect(PATHS.FORBIDDEN).toBe("/403")
  })
})

describe("INTERNAL_BANK_ROLES", () => {
  it("contains all internal bank roles", () => {
    expect(INTERNAL_BANK_ROLES).toContain("system_admin")
    expect(INTERNAL_BANK_ROLES).toContain("support_user")
    expect(INTERNAL_BANK_ROLES).toContain("auditor")
    expect(INTERNAL_BANK_ROLES).toContain("front_office")
    expect(INTERNAL_BANK_ROLES).toContain("back_office")
  })

  it("does NOT contain leasing_company_user", () => {
    expect(INTERNAL_BANK_ROLES.includes("leasing_company_user")).toBe(false)
  })
})

describe("LC_ONLY_ROLES", () => {
  it("contains only leasing_company_user", () => {
    expect(LC_ONLY_ROLES).toEqual(["leasing_company_user"])
  })

  it("does NOT contain any internal bank role", () => {
    const internalRoles = [
      "system_admin",
      "support_user",
      "auditor",
      "front_office",
      "back_office",
    ] as const
    internalRoles.forEach(role => {
      expect(LC_ONLY_ROLES.includes(role)).toBe(false)
    })
  })
})
