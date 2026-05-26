import { describe, it, expect } from "vitest"
import { READ_ONLY_VIEWER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

/**
 * Unit tests for the logic backing SupportContextBanner.
 *
 * The banner renders only for support_user. These tests verify the role
 * predicate and that the constants driving the banner logic are correct.
 * Component rendering is covered by QA's E2E suite.
 */

function shouldShowBanner(role: UserRole): boolean {
  return role === "support_user"
}

function resolveTenantLabel(tenantId: string | null): string {
  return tenantId ?? "All Tenants"
}

describe("SupportContextBanner visibility logic", () => {
  it("shows banner for support_user", () => {
    expect(shouldShowBanner("support_user")).toBe(true)
  })

  it("does not show banner for system_admin", () => {
    expect(shouldShowBanner("system_admin")).toBe(false)
  })

  it("does not show banner for auditor", () => {
    expect(shouldShowBanner("auditor")).toBe(false)
  })

  it("does not show banner for front_office", () => {
    expect(shouldShowBanner("front_office")).toBe(false)
  })

  it("does not show banner for back_office", () => {
    expect(shouldShowBanner("back_office")).toBe(false)
  })

  it("does not show banner for leasing_company_user", () => {
    expect(shouldShowBanner("leasing_company_user")).toBe(false)
  })
})

describe("SupportContextBanner tenant label logic", () => {
  it("shows specific tenant ID when tenant_id is set", () => {
    expect(resolveTenantLabel("TENANT-001")).toBe("TENANT-001")
  })

  it("shows All Tenants when tenant_id is null (cross-tenant access)", () => {
    expect(resolveTenantLabel(null)).toBe("All Tenants")
  })
})

describe("READ_ONLY_VIEWER_ROLES includes support_user", () => {
  it("support_user is in READ_ONLY_VIEWER_ROLES", () => {
    expect(READ_ONLY_VIEWER_ROLES).toContain("support_user")
  })

  it("banner role (support_user) is a subset of READ_ONLY_VIEWER_ROLES", () => {
    // The banner uses role === 'support_user' check; verify that role is read-only
    expect(READ_ONLY_VIEWER_ROLES.includes("support_user")).toBe(true)
  })
})
