import { vi, describe, it, expect, beforeEach } from "vitest"
import type { UserResponse } from "@/features/users/api/schema"
import {
  LC_ONLY_ROLES,
  INTERNAL_BANK_ROLES,
  READ_ONLY_VIEWER_ROLES,
} from "@/features/users/types"

const mockUseCurrentUser = vi.hoisted(() => vi.fn())

vi.mock("@/features/users/hooks/useCurrentUser", () => ({
  useCurrentUser: mockUseCurrentUser,
}))

// Import hook after mock is set up
import { useSensitiveFieldGuard } from "@/hooks/useSensitiveFieldGuard"

const BASE_USER: UserResponse = {
  id: "00000000-0000-0000-0000-000000000000",
  user_id: "USR-00001",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  role: "system_admin",
  permissions: [],
  tenant_id: null,
  status: "active",
  access_valid_until: null,
  invited_by: null,
  invited_at: null,
  activated_at: null,
  last_login: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function mockUser(role: UserResponse["role"]) {
  mockUseCurrentUser.mockReturnValue({ data: { ...BASE_USER, role } })
}

function mockNoUser() {
  mockUseCurrentUser.mockReturnValue({ data: undefined })
}

describe("useSensitiveFieldGuard", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset()
  })

  it("returns true for leasing_company_user (must hide sensitive fields)", () => {
    mockUser("leasing_company_user")
    expect(useSensitiveFieldGuard()).toBe(true)
  })

  it("returns true for support_user (must hide KYC/AML, pricing, margin)", () => {
    mockUser("support_user")
    expect(useSensitiveFieldGuard()).toBe(true)
  })

  it("returns true for auditor (must hide sensitive fields)", () => {
    mockUser("auditor")
    expect(useSensitiveFieldGuard()).toBe(true)
  })

  it("returns false for system_admin (may see sensitive fields)", () => {
    mockUser("system_admin")
    expect(useSensitiveFieldGuard()).toBe(false)
  })

  it("returns false for front_office", () => {
    mockUser("front_office")
    expect(useSensitiveFieldGuard()).toBe(false)
  })

  it("returns false for back_office", () => {
    mockUser("back_office")
    expect(useSensitiveFieldGuard()).toBe(false)
  })

  it("returns false when no user is authenticated", () => {
    mockNoUser()
    expect(useSensitiveFieldGuard()).toBe(false)
  })
})

describe("LC_ONLY_ROLES constant", () => {
  it("contains leasing_company_user", () => {
    expect(LC_ONLY_ROLES).toContain("leasing_company_user")
  })

  it("does NOT contain any internal bank role", () => {
    INTERNAL_BANK_ROLES.forEach(role => {
      expect(LC_ONLY_ROLES.includes(role)).toBe(false)
    })
  })
})

describe("READ_ONLY_VIEWER_ROLES constant", () => {
  it("contains support_user", () => {
    expect(READ_ONLY_VIEWER_ROLES).toContain("support_user")
  })

  it("contains auditor", () => {
    expect(READ_ONLY_VIEWER_ROLES).toContain("auditor")
  })

  it("does NOT contain system_admin", () => {
    expect(READ_ONLY_VIEWER_ROLES.includes("system_admin")).toBe(false)
  })

  it("does NOT contain front_office", () => {
    expect(READ_ONLY_VIEWER_ROLES.includes("front_office")).toBe(false)
  })

  it("does NOT contain back_office", () => {
    expect(READ_ONLY_VIEWER_ROLES.includes("back_office")).toBe(false)
  })

  it("does NOT contain leasing_company_user", () => {
    expect(READ_ONLY_VIEWER_ROLES.includes("leasing_company_user")).toBe(false)
  })
})
