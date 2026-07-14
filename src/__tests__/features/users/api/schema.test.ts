import { describe, it, expect } from "vitest"
import {
  EditUserRequestSchema,
  ExportFormatSchema,
  ExportJobSchema,
  ExportJobStatusSchema,
  UserListItemSchema,
  UserMePermissionsResponseSchema,
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

  it("accepts optional profile_picture_url as undefined", () => {
    expect(() => UserListItemSchema.parse(validUserListItem)).not.toThrow()
  })

  it("accepts profile_picture_url as null", () => {
    const item = { ...validUserListItem, profile_picture_url: null }
    expect(() => UserListItemSchema.parse(item)).not.toThrow()
  })

  it("accepts profile_picture_url as a url string", () => {
    const item = {
      ...validUserListItem,
      profile_picture_url: "https://cdn.example.com/avatar.png",
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

  it("accepts leasing_company_user as a valid role (visible in Roles filter)", () => {
    const item = { ...validUserListItem, role: "leasing_company_user" }
    expect(() => UserListItemSchema.parse(item)).not.toThrow()
  })

  it("rejects unknown status value", () => {
    const item = { ...validUserListItem, status: "unknown_status" }
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

const validUserDetail = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  user_id: "USR-00001",
  first_name: "Anna",
  last_name: "Müller",
  email: "anna.mueller@example.com",
  role: "system_admin",
  status: "active",
  tenant_id: null,
  tenant_name: null,
  phone_number: null,
  pending_email: null,
  access_valid_until: null,
  invited_by: null,
  approved_by: null,
  invited_at: null,
  activated_at: null,
  last_login: null,
  created_at: "2026-01-01T00:00:00Z",
}

import {
  UserDetailResponseSchema,
  UpdateAccessPeriodRequestSchema,
} from "@/features/users/api/schema"

describe("UserDetailResponseSchema", () => {
  it("accepts a valid minimal payload (all optional fields absent)", () => {
    expect(() => UserDetailResponseSchema.parse(validUserDetail)).not.toThrow()
  })

  it("accepts a valid full payload (all fields populated)", () => {
    const full = {
      ...validUserDetail,
      tenant_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      tenant_name: "Musterbank AG",
      access_valid_until: "2026-12-31T23:59:59Z",
      invited_by: { id: "USR-00042", name: "Test Inviter" },
      approved_by: { id: "USR-00087", name: "Test Approver" },
      invited_at: "2026-01-01T09:00:00Z",
      activated_at: "2026-01-02T10:00:00Z",
      last_login: "2026-05-20T10:00:00Z",
      last_activity: "2026-05-21T08:30:00Z",
      last_suspension_reason: "security_concern",
      last_deactivation_reason: "offboarding",
      is_service_account: false,
    }
    expect(() => UserDetailResponseSchema.parse(full)).not.toThrow()
  })

  it("rejects an invalid UUID for id", () => {
    const item = { ...validUserDetail, id: "not-a-uuid" }
    expect(() => UserDetailResponseSchema.parse(item)).toThrow()
  })

  it("rejects an invalid email", () => {
    const item = { ...validUserDetail, email: "not-an-email" }
    expect(() => UserDetailResponseSchema.parse(item)).toThrow()
  })

  it("rejects an unknown status value", () => {
    const item = { ...validUserDetail, status: "unknown_status" }
    expect(() => UserDetailResponseSchema.parse(item)).toThrow()
  })

  it("rejects an unknown role value", () => {
    const item = { ...validUserDetail, role: "super_admin" }
    expect(() => UserDetailResponseSchema.parse(item)).toThrow()
  })

  it("accepts leasing_company_user as a valid role", () => {
    const item = { ...validUserDetail, role: "leasing_company_user" }
    expect(() => UserDetailResponseSchema.parse(item)).not.toThrow()
  })

  it("accepts absent last_activity (truly optional)", () => {
    const item = Object.fromEntries(
      Object.entries({
        ...validUserDetail,
        last_activity: "2026-05-01T00:00:00Z",
      }).filter(([k]) => k !== "last_activity")
    )
    expect(() => UserDetailResponseSchema.parse(item)).not.toThrow()
  })

  it("accepts absent last_suspension_reason (truly optional)", () => {
    const item = Object.fromEntries(
      Object.entries({
        ...validUserDetail,
        last_suspension_reason: "security_concern",
      }).filter(([k]) => k !== "last_suspension_reason")
    )
    expect(() => UserDetailResponseSchema.parse(item)).not.toThrow()
  })

  it("accepts absent last_deactivation_reason (truly optional)", () => {
    const item = Object.fromEntries(
      Object.entries({
        ...validUserDetail,
        last_deactivation_reason: "offboarding",
      }).filter(([k]) => k !== "last_deactivation_reason")
    )
    expect(() => UserDetailResponseSchema.parse(item)).not.toThrow()
  })

  it("accepts absent is_service_account (truly optional)", () => {
    const item = Object.fromEntries(
      Object.entries({ ...validUserDetail, is_service_account: true }).filter(
        ([k]) => k !== "is_service_account"
      )
    )
    expect(() => UserDetailResponseSchema.parse(item)).not.toThrow()
  })
})

describe("UpdateAccessPeriodRequestSchema", () => {
  const valid = {
    new_access_valid_until: "2027-05-23T00:00:00.000Z",
    reason: "regulatory_audit",
  }

  it("accepts a valid payload", () => {
    expect(() => UpdateAccessPeriodRequestSchema.parse(valid)).not.toThrow()
  })

  it("accepts all valid reason values", () => {
    const reasons = [
      "regulatory_audit",
      "internal_audit",
      "compliance_review",
      "investigation",
      "temporary_review_access",
      "other",
    ]
    for (const reason of reasons) {
      expect(() =>
        UpdateAccessPeriodRequestSchema.parse({ ...valid, reason })
      ).not.toThrow()
    }
  })

  it("rejects an unknown reason", () => {
    expect(() =>
      UpdateAccessPeriodRequestSchema.parse({
        ...valid,
        reason: "unknown_reason",
      })
    ).toThrow()
  })

  it("rejects empty new_access_valid_until", () => {
    expect(() =>
      UpdateAccessPeriodRequestSchema.parse({
        ...valid,
        new_access_valid_until: "",
      })
    ).toThrow()
  })

  it("rejects missing new_access_valid_until", () => {
    expect(() =>
      UpdateAccessPeriodRequestSchema.parse({ reason: valid.reason })
    ).toThrow()
  })

  it("rejects missing reason", () => {
    expect(() =>
      UpdateAccessPeriodRequestSchema.parse({
        new_access_valid_until: valid.new_access_valid_until,
      })
    ).toThrow()
  })
})

describe("UserStatusSchema", () => {
  it("accepts pending_approval", () => {
    expect(() => UserStatusSchema.parse("pending_approval")).not.toThrow()
  })

  it("accepts rejected", () => {
    expect(() => UserStatusSchema.parse("rejected")).not.toThrow()
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
    expect(() => UserStatusSchema.parse("unknown_status")).toThrow()
  })

  it("rejects empty string", () => {
    expect(() => UserStatusSchema.parse("")).toThrow()
  })
})

describe("ExportFormatSchema", () => {
  it("accepts csv", () => {
    expect(ExportFormatSchema.parse("csv")).toBe("csv")
  })

  it("accepts xlsx", () => {
    expect(ExportFormatSchema.parse("xlsx")).toBe("xlsx")
  })

  it("rejects unknown format", () => {
    expect(() => ExportFormatSchema.parse("pdf")).toThrow()
  })
})

describe("ExportJobSchema", () => {
  it("accepts a valid initiate response", () => {
    const job = {
      job_id: "abc123",
      status: "processing",
      poll_url: "/api/v1/users/export/status/abc123",
      download_url: "/api/v1/users/export/download/abc123",
    }
    expect(() => ExportJobSchema.parse(job)).not.toThrow()
  })

  it("accepts response without optional urls", () => {
    expect(() =>
      ExportJobSchema.parse({ job_id: "x", status: "processing" })
    ).not.toThrow()
  })

  it("rejects missing job_id", () => {
    expect(() => ExportJobSchema.parse({ status: "processing" })).toThrow()
  })
})

describe("ExportJobStatusSchema", () => {
  it("accepts processing status", () => {
    const result = ExportJobStatusSchema.parse({
      job_id: "x",
      status: "processing",
    })
    expect(result.status).toBe("processing")
  })

  it("accepts ready status", () => {
    const result = ExportJobStatusSchema.parse({ job_id: "x", status: "ready" })
    expect(result.status).toBe("ready")
  })

  it("accepts failed status with optional fields", () => {
    const result = ExportJobStatusSchema.parse({
      job_id: "x",
      status: "failed",
      error_code: "FILE_GENERATION_FAILED",
    })
    expect(result.status).toBe("failed")
    expect(result.error_code).toBe("FILE_GENERATION_FAILED")
  })

  it("accepts ready status with row_count", () => {
    const result = ExportJobStatusSchema.parse({
      job_id: "x",
      status: "ready",
      row_count: 42,
    })
    expect(result.row_count).toBe(42)
  })

  it("rejects unknown status", () => {
    expect(() =>
      ExportJobStatusSchema.parse({ job_id: "x", status: "completed" })
    ).toThrow()
  })
})

describe("EditUserRequestSchema", () => {
  it("accepts name-only payload", () => {
    expect(() =>
      EditUserRequestSchema.parse({
        first_name: "Anna",
        last_name: "Müller",
      })
    ).not.toThrow()
  })

  it("accepts phone-only payload", () => {
    expect(() =>
      EditUserRequestSchema.parse({ phone_number: "+49 30 12345678" })
    ).not.toThrow()
  })

  it("accepts combined name and phone payload", () => {
    expect(() =>
      EditUserRequestSchema.parse({
        first_name: "Anna",
        last_name: "Müller",
        phone_number: "+49 30 12345678",
      })
    ).not.toThrow()
  })

  it("accepts null phone to clear the field", () => {
    expect(() =>
      EditUserRequestSchema.parse({ phone_number: null })
    ).not.toThrow()
  })

  it("accepts empty payload (all fields optional)", () => {
    expect(() => EditUserRequestSchema.parse({})).not.toThrow()
  })

  it("rejects phone with invalid format", () => {
    expect(() =>
      EditUserRequestSchema.parse({ phone_number: "not-a-phone" })
    ).toThrow()
  })

  it("rejects first_name exceeding max length", () => {
    expect(() =>
      EditUserRequestSchema.parse({ first_name: "A".repeat(101) })
    ).toThrow()
  })

  it("rejects empty string first_name", () => {
    expect(() => EditUserRequestSchema.parse({ first_name: "" })).toThrow()
  })
})

describe("UserMePermissionsResponseSchema", () => {
  it("accepts a valid permissions response", () => {
    expect(() =>
      UserMePermissionsResponseSchema.parse({
        role: "bank_power_user",
        permissions: ["product_template:read", "product_template:create"],
        active_modules: ["bank_product_template", "audit_trail"],
      })
    ).not.toThrow()
  })

  it("accepts empty permissions and active_modules arrays", () => {
    expect(() =>
      UserMePermissionsResponseSchema.parse({
        role: "system_admin",
        permissions: [],
        active_modules: [],
      })
    ).not.toThrow()
  })

  it("rejects an unknown role value", () => {
    expect(() =>
      UserMePermissionsResponseSchema.parse({
        role: "banana",
        permissions: [],
        active_modules: [],
      })
    ).toThrow()
  })

  it("rejects a missing active_modules field", () => {
    expect(() =>
      UserMePermissionsResponseSchema.parse({
        role: "system_admin",
        permissions: [],
      })
    ).toThrow()
  })

  it("rejects non-string entries in active_modules", () => {
    expect(() =>
      UserMePermissionsResponseSchema.parse({
        role: "system_admin",
        permissions: [],
        active_modules: [123],
      })
    ).toThrow()
  })
})
