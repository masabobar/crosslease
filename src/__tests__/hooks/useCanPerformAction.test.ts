import { vi, describe, it, expect, beforeEach } from "vitest"
import type { UserResponse } from "@/features/users/api/schema"
import { WRITE_ACTION_ROLES } from "@/features/users/types"

const mockUseCurrentUser = vi.hoisted(() => vi.fn())

vi.mock("@/features/users/hooks/useCurrentUser", () => ({
  useCurrentUser: mockUseCurrentUser,
}))

// Import hook after mock is set up
import { useCanPerformAction } from "@/hooks/useCanPerformAction"

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

describe("useCanPerformAction", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset()
  })

  it("returns true for system_admin", () => {
    mockUser("system_admin")
    expect(useCanPerformAction()).toBe(true)
  })

  it("returns true for front_office", () => {
    mockUser("front_office")
    expect(useCanPerformAction()).toBe(true)
  })

  it("returns true for back_office", () => {
    mockUser("back_office")
    expect(useCanPerformAction()).toBe(true)
  })

  it("returns false for support_user (read-only)", () => {
    mockUser("support_user")
    expect(useCanPerformAction()).toBe(false)
  })

  it("returns false for auditor (read-only)", () => {
    mockUser("auditor")
    expect(useCanPerformAction()).toBe(false)
  })

  it("returns false for leasing_company_user (LC user)", () => {
    mockUser("leasing_company_user")
    expect(useCanPerformAction()).toBe(false)
  })

  it("returns false when no user is authenticated", () => {
    mockNoUser()
    expect(useCanPerformAction()).toBe(false)
  })
})

describe("WRITE_ACTION_ROLES constant", () => {
  it("contains system_admin, front_office, back_office", () => {
    expect(WRITE_ACTION_ROLES).toContain("system_admin")
    expect(WRITE_ACTION_ROLES).toContain("front_office")
    expect(WRITE_ACTION_ROLES).toContain("back_office")
  })

  it("does NOT contain support_user", () => {
    expect(WRITE_ACTION_ROLES.includes("support_user")).toBe(false)
  })

  it("does NOT contain auditor", () => {
    expect(WRITE_ACTION_ROLES.includes("auditor")).toBe(false)
  })

  it("does NOT contain leasing_company_user", () => {
    expect(WRITE_ACTION_ROLES.includes("leasing_company_user")).toBe(false)
  })
})
