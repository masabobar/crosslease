import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchUsers,
  inviteUser,
  approveUser,
  suspendUser,
  reactivateUser,
  deactivateUser,
  resendInvitation,
} from "@/features/users/api/usersApi"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = "ApiError"
      this.code = code
    }
  },
}))

import { api } from "@/lib/api"

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

const validUserResponse = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  user_id: "USR-00001",
  first_name: "Anna",
  last_name: "Müller",
  email: "anna.mueller@example.com",
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

const validInviteUserResponse = { user: validUserResponse }

const validPaginatedResponse = {
  users: [],
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue(validPaginatedResponse)
  mockApi.post.mockResolvedValue(validInviteUserResponse)
})

describe("fetchUsers", () => {
  it("calls GET /users with no query string when no params provided", async () => {
    await fetchUsers()
    expect(mockApi.get).toHaveBeenCalledWith("/users")
  })

  it("appends search param to query string", async () => {
    await fetchUsers({ search: "anna" })
    expect(mockApi.get).toHaveBeenCalledWith("/users?search=anna")
  })

  it("appends page and per_page params", async () => {
    await fetchUsers({ page: 2, per_page: 50 })
    expect(mockApi.get).toHaveBeenCalledWith("/users?page=2&per_page=50")
  })

  it("appends multiple role params using append()", async () => {
    await fetchUsers({ role: ["system_admin", "auditor"] })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain("role=system_admin")
    expect(url).toContain("role=auditor")
  })

  it("appends leasing_company_user as a role filter param", async () => {
    await fetchUsers({ role: ["leasing_company_user"] })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain("role=leasing_company_user")
  })

  it("appends multiple status params using append()", async () => {
    await fetchUsers({ status: ["active", "suspended"] })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain("status=active")
    expect(url).toContain("status=suspended")
  })

  it("appends tenant_id param", async () => {
    await fetchUsers({ tenant_id: "abc-123" })
    expect(mockApi.get).toHaveBeenCalledWith("/users?tenant_id=abc-123")
  })

  it("appends sort_by and sort_order params", async () => {
    await fetchUsers({ sort_by: "name", sort_order: "desc" })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain("sort_by=name")
    expect(url).toContain("sort_order=desc")
  })

  it("does NOT send mfa_enabled to the API (not supported by backend)", async () => {
    await fetchUsers({ mfa_enabled: true })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).not.toContain("mfa_enabled")
  })

  it("does NOT send lg_id to the API (not supported by backend)", async () => {
    await fetchUsers({ lg_id: "some-lg-id" })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).not.toContain("lg_id")
  })

  it("sends last_login_from and last_login_to params to the API", async () => {
    await fetchUsers({
      last_login_from: "2026-01-01",
      last_login_to: "2026-12-31",
    })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain("last_login_from=2026-01-01")
    expect(url).toContain("last_login_to=2026-12-31")
  })

  it("does NOT send unsupported date range params to the API", async () => {
    await fetchUsers({
      access_expiry_from: "2026-01-01",
      access_expiry_to: "2026-12-31",
      created_from: "2026-01-01",
      created_to: "2026-12-31",
    })
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).not.toContain("access_expiry_from")
    expect(url).not.toContain("access_expiry_to")
    expect(url).not.toContain("created_from")
    expect(url).not.toContain("created_to")
  })

  it("returns the parsed PaginatedUsersResponse", async () => {
    const response = await fetchUsers()
    expect(response.total).toBe(0)
    expect(response.users).toEqual([])
  })

  it("throws when API response does not match PaginatedUsersResponseSchema", async () => {
    mockApi.get.mockResolvedValue({ unexpected: true })
    await expect(fetchUsers()).rejects.toThrow()
  })
})

describe("inviteUser", () => {
  it("calls POST /users with the correct body", async () => {
    const input = {
      first_name: "Anna",
      last_name: "Müller",
      email: "anna@example.com",
      role: "system_admin" as const,
    }
    await inviteUser(input)
    expect(mockApi.post).toHaveBeenCalledWith("/users", input)
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await inviteUser({
      first_name: "Anna",
      last_name: "Müller",
      email: "anna@example.com",
      role: "system_admin",
    })
    expect(result.user.email).toBe("anna.mueller@example.com")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ unexpected: true })
    await expect(
      inviteUser({
        first_name: "A",
        last_name: "B",
        email: "a@b.com",
        role: "auditor",
      })
    ).rejects.toThrow()
  })
})

describe("approveUser", () => {
  it("calls POST /users/:id/approve with empty body", async () => {
    await approveUser("user-123")
    expect(mockApi.post).toHaveBeenCalledWith("/users/user-123/approve", {})
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await approveUser("user-123")
    expect(result.user.id).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ bad: "data" })
    await expect(approveUser("user-123")).rejects.toThrow()
  })
})

describe("suspendUser", () => {
  const input = {
    reason: "security_concern" as const,
    effective_from: "2026-06-01",
  }

  it("calls POST /users/:id/suspend with the correct body", async () => {
    await suspendUser("user-123", input)
    expect(mockApi.post).toHaveBeenCalledWith("/users/user-123/suspend", input)
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await suspendUser("user-123", input)
    expect(result.user.id).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ bad: "data" })
    await expect(suspendUser("user-123", input)).rejects.toThrow()
  })
})

describe("reactivateUser", () => {
  const input = { reason: "administrative_decision" as const }

  it("calls POST /users/:id/reactivate with the correct body", async () => {
    await reactivateUser("user-123", input)
    expect(mockApi.post).toHaveBeenCalledWith(
      "/users/user-123/reactivate",
      input
    )
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await reactivateUser("user-123", input)
    expect(result.user.id).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ bad: "data" })
    await expect(reactivateUser("user-123", input)).rejects.toThrow()
  })
})

describe("deactivateUser", () => {
  const input = {
    reason: "offboarding" as const,
    effective_from: "2026-06-01",
  }

  it("calls POST /users/:id/deactivate with the correct body", async () => {
    await deactivateUser("user-123", input)
    expect(mockApi.post).toHaveBeenCalledWith(
      "/users/user-123/deactivate",
      input
    )
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await deactivateUser("user-123", input)
    expect(result.user.id).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ bad: "data" })
    await expect(deactivateUser("user-123", input)).rejects.toThrow()
  })
})

describe("resendInvitation", () => {
  const input = { reason: "invitation_expired" as const }

  it("calls POST /users/:id/resend-invitation with the correct body", async () => {
    await resendInvitation("user-123", input)
    expect(mockApi.post).toHaveBeenCalledWith(
      "/users/user-123/resend-invitation",
      input
    )
  })

  it("returns the parsed InviteUserResponse", async () => {
    const result = await resendInvitation("user-123", input)
    expect(result.user.id).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")
  })

  it("throws when API response does not match InviteUserResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ bad: "data" })
    await expect(resendInvitation("user-123", input)).rejects.toThrow()
  })
})
