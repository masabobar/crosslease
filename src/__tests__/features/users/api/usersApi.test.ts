import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchUsers } from "@/features/users/api/usersApi"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
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

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> }

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
