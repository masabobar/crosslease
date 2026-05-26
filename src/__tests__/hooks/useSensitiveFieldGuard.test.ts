import { vi, describe, it, expect, beforeEach } from "vitest"
import type { UserResponse } from "@/features/users/api/schema"
import { LC_ONLY_ROLES, INTERNAL_BANK_ROLES } from "@/features/users/types"

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
  tenant_id: null,
  status: "active",
  access_valid_from: null,
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

  it("returns false for system_admin (may see sensitive fields)", () => {
    mockUser("system_admin")
    expect(useSensitiveFieldGuard()).toBe(false)
  })

  it("returns false for support_user", () => {
    mockUser("support_user")
    expect(useSensitiveFieldGuard()).toBe(false)
  })

  it("returns false for auditor", () => {
    mockUser("auditor")
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
