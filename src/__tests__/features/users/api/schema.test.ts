import { describe, it, expect } from "vitest"
import {
  UserListItemSchema,
  PaginatedUsersResponseSchema,
  UserStatusSchema,
} from "@/features/users/api/schema"

const validUserListItem = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  user_id: "USR-00001",
  first_name: "Anna",
  last_name: "Müller",
  email: "anna.mueller@example.com",
  role: "system_admin",
  tenant_id: null,
  tenant_name: null,
  mfa_enabled: true,
  status: "active",
  last_login: "2026-05-20T10:00:00Z",
  access_valid_from: null,
  access_valid_until: null,
}

describe("UserListItemSchema", () => {
  it("accepts a valid user list item", () => {
    expect(() => UserListItemSchema.parse(validUserListItem)).not.toThrow()
  })

  it("accepts null values for nullable fields", () => {
    const item = {
      ...validUserListItem,
      tenant_id: null,
      tenant_name: null,
      mfa_enabled: null,
      last_login: null,
      access_valid_from: null,
      access_valid_until: null,
    }
    expect(() => UserListItemSchema.parse(item)).not.toThrow()
  })

  it("accepts optional mfa_enabled as undefined", () => {
    const item = Object.fromEntries(
      Object.entries(validUserListItem).filter(([k]) => k !== "mfa_enabled")
    )
    expect(() => UserListItemSchema.parse(item)).not.toThrow()
  })

  it("accepts access_valid_until as a date string", () => {
    const item = {
      ...validUserListItem,
      access_valid_until: "2026-12-31T00:00:00Z",
    }
    expect(() => UserListItemSchema.parse(item)).not.toThrow()
  })

  it("rejects missing required id field", () => {
    const item = Object.fromEntries(
      Object.entries(validUserListItem).filter(([k]) => k !== "id")
    )
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects non-UUID id", () => {
    const item = { ...validUserListItem, id: "not-a-uuid" }
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects invalid email", () => {
    const item = { ...validUserListItem, email: "not-an-email" }
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects unknown role value", () => {
    const item = { ...validUserListItem, role: "super_admin" }
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects unknown status value", () => {
    const item = { ...validUserListItem, status: "archived" }
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects non-boolean mfa_enabled", () => {
    const item = { ...validUserListItem, mfa_enabled: "yes" }
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects missing first_name", () => {
    const item = Object.fromEntries(
      Object.entries(validUserListItem).filter(([k]) => k !== "first_name")
    )
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })

  it("rejects missing last_name", () => {
    const item = Object.fromEntries(
      Object.entries(validUserListItem).filter(([k]) => k !== "last_name")
    )
    expect(() => UserListItemSchema.parse(item)).toThrow()
  })
})

describe("PaginatedUsersResponseSchema", () => {
  const validPaginatedResponse = {
    users: [validUserListItem],
    total: 1,
    page: 1,
    per_page: 10,
    total_pages: 1,
  }

  it("accepts a valid paginated response", () => {
    expect(() =>
      PaginatedUsersResponseSchema.parse(validPaginatedResponse)
    ).not.toThrow()
  })

  it("accepts an empty users array", () => {
    const response = {
      ...validPaginatedResponse,
      users: [],
      total: 0,
      total_pages: 0,
    }
    expect(() => PaginatedUsersResponseSchema.parse(response)).not.toThrow()
  })

  it("rejects missing users field", () => {
    const response = Object.fromEntries(
      Object.entries(validPaginatedResponse).filter(([k]) => k !== "users")
    )
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects missing total field", () => {
    const response = Object.fromEntries(
      Object.entries(validPaginatedResponse).filter(([k]) => k !== "total")
    )
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects missing page field", () => {
    const response = Object.fromEntries(
      Object.entries(validPaginatedResponse).filter(([k]) => k !== "page")
    )
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects missing per_page field", () => {
    const response = Object.fromEntries(
      Object.entries(validPaginatedResponse).filter(([k]) => k !== "per_page")
    )
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects missing total_pages field", () => {
    const response = Object.fromEntries(
      Object.entries(validPaginatedResponse).filter(
        ([k]) => k !== "total_pages"
      )
    )
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects total as a string", () => {
    const response = { ...validPaginatedResponse, total: "1" }
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })

  it("rejects invalid user in users array", () => {
    const response = {
      ...validPaginatedResponse,
      users: [{ ...validUserListItem, email: "bad-email" }],
    }
    expect(() => PaginatedUsersResponseSchema.parse(response)).toThrow()
  })
})

describe("UserStatusSchema", () => {
  it("accepts pending_activation", () => {
    expect(() => UserStatusSchema.parse("pending_activation")).not.toThrow()
  })

  it("accepts invited", () => {
    expect(() => UserStatusSchema.parse("invited")).not.toThrow()
  })

  it("accepts active", () => {
    expect(() => UserStatusSchema.parse("active")).not.toThrow()
  })

  it("accepts suspended", () => {
    expect(() => UserStatusSchema.parse("suspended")).not.toThrow()
  })

  it("accepts deactivated", () => {
    expect(() => UserStatusSchema.parse("deactivated")).not.toThrow()
  })

  it("accepts expired", () => {
    expect(() => UserStatusSchema.parse("expired")).not.toThrow()
  })

  it("rejects unknown status string", () => {
    expect(() => UserStatusSchema.parse("archived")).toThrow()
  })

  it("rejects empty string", () => {
    expect(() => UserStatusSchema.parse("")).toThrow()
  })
})
