import { describe, it, expect } from "vitest"
import {
  CreateTenantFormSchema,
  PlatformModulesResponseSchema,
  SeedPackagesResponseSchema,
  TenantListItemSchema,
  TenantsResponseSchema,
  TenantTypeSchema,
  SeedPackageSchema,
} from "@/features/tenants/api/schema"

const validTenantListItem = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  tenant_id: "TNT-00001",
  name: "First National Bank",
  code: "FNB",
  country: "DE",
  default_currency: "EUR",
  tenant_type: "bank",
  status: "active",
  active_module_count: 5,
}

describe("TenantListItemSchema", () => {
  it("accepts a valid list item", () => {
    expect(() => TenantListItemSchema.parse(validTenantListItem)).not.toThrow()
  })

  it("accepts all tenant_type values", () => {
    for (const type of ["bank", "bank_entity", "bank_branch_group"] as const) {
      expect(() =>
        TenantListItemSchema.parse({
          ...validTenantListItem,
          tenant_type: type,
        })
      ).not.toThrow()
    }
  })

  it("rejects unknown tenant_type", () => {
    expect(() =>
      TenantListItemSchema.parse({
        ...validTenantListItem,
        tenant_type: "cooperative",
      })
    ).toThrow()
  })

  it("accepts all status values", () => {
    for (const status of [
      "draft",
      "active",
      "suspended",
      "archived",
      "rejected",
      "expired",
    ] as const) {
      expect(() =>
        TenantListItemSchema.parse({ ...validTenantListItem, status })
      ).not.toThrow()
    }
  })

  it("rejects unknown status", () => {
    expect(() =>
      TenantListItemSchema.parse({ ...validTenantListItem, status: "pending" })
    ).toThrow()
  })

  it("rejects active_module_count as string", () => {
    expect(() =>
      TenantListItemSchema.parse({
        ...validTenantListItem,
        active_module_count: "5",
      })
    ).toThrow()
  })

  it("rejects active_module_count as float", () => {
    expect(() =>
      TenantListItemSchema.parse({
        ...validTenantListItem,
        active_module_count: 5.5,
      })
    ).toThrow()
  })

  it("rejects missing tenant_type field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenant_type, ...rest } = validTenantListItem
    expect(() => TenantListItemSchema.parse(rest)).toThrow()
  })

  it("rejects missing active_module_count field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { active_module_count, ...rest } = validTenantListItem
    expect(() => TenantListItemSchema.parse(rest)).toThrow()
  })

  it("rejects invalid uuid for id", () => {
    expect(() =>
      TenantListItemSchema.parse({ ...validTenantListItem, id: "not-a-uuid" })
    ).toThrow()
  })
})

describe("TenantsResponseSchema", () => {
  it("accepts a valid paginated response", () => {
    expect(() =>
      TenantsResponseSchema.parse({
        tenants: [validTenantListItem],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      })
    ).not.toThrow()
  })

  it("accepts an empty tenants array", () => {
    expect(() =>
      TenantsResponseSchema.parse({
        tenants: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      })
    ).not.toThrow()
  })

  it("rejects response missing total_pages", () => {
    expect(() =>
      TenantsResponseSchema.parse({
        tenants: [],
        total: 0,
        page: 1,
        per_page: 20,
      })
    ).toThrow()
  })

  it("rejects tenants entry with invalid item", () => {
    expect(() =>
      TenantsResponseSchema.parse({
        tenants: [{ ...validTenantListItem, status: "unknown_status" }],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      })
    ).toThrow()
  })
})

const validCreateTenantPayload = {
  name: "Test Bank",
  code: "TEST-BANK",
  tenant_type: "bank" as const,
  default_currency: "EUR",
  legal_entity_name: "Test Bank AG",
  country: "DE",
  description: "A test bank tenant",
  modules: ["risk_management"],
  seed_package: "standard_retail_bank" as const,
  core_banking_integration_ref: "CBR-001",
}

describe("CreateTenantFormSchema", () => {
  it("accepts a valid payload", () => {
    expect(() =>
      CreateTenantFormSchema.parse(validCreateTenantPayload)
    ).not.toThrow()
  })

  it("accepts payload without optional fields", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      description: _d,
      core_banking_integration_ref: _c,
      ...required
    } = validCreateTenantPayload
    expect(() => CreateTenantFormSchema.parse(required)).not.toThrow()
  })

  it("rejects name that is too short", () => {
    expect(() =>
      CreateTenantFormSchema.parse({ ...validCreateTenantPayload, name: "A" })
    ).toThrow()
  })

  it("rejects code with invalid characters", () => {
    expect(() =>
      CreateTenantFormSchema.parse({
        ...validCreateTenantPayload,
        code: "invalid code!",
      })
    ).toThrow()
  })

  it("accepts code with hyphens", () => {
    expect(() =>
      CreateTenantFormSchema.parse({
        ...validCreateTenantPayload,
        code: "BANK-01",
      })
    ).not.toThrow()
  })

  it("rejects unknown tenant_type", () => {
    expect(() =>
      CreateTenantFormSchema.parse({
        ...validCreateTenantPayload,
        tenant_type: "unknown_type",
      })
    ).toThrow()
  })

  it("rejects country that is not 2 characters", () => {
    expect(() =>
      CreateTenantFormSchema.parse({
        ...validCreateTenantPayload,
        country: "DEU",
      })
    ).toThrow()
  })

  it("rejects missing required fields", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _n, ...rest } = validCreateTenantPayload
    expect(() => CreateTenantFormSchema.parse(rest)).toThrow()
  })

  it("rejects missing seed_package", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { seed_package: _s, ...rest } = validCreateTenantPayload
    expect(() => CreateTenantFormSchema.parse(rest)).toThrow()
  })

  it("rejects missing modules field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { modules: _m, ...rest } = validCreateTenantPayload
    expect(() => CreateTenantFormSchema.parse(rest)).toThrow()
  })
})

describe("TenantTypeSchema", () => {
  it("accepts all valid tenant types", () => {
    expect(() => TenantTypeSchema.parse("bank")).not.toThrow()
    expect(() => TenantTypeSchema.parse("bank_entity")).not.toThrow()
    expect(() => TenantTypeSchema.parse("bank_branch_group")).not.toThrow()
  })

  it("rejects invalid tenant type", () => {
    expect(() => TenantTypeSchema.parse("invalid")).toThrow()
  })
})

describe("SeedPackageSchema", () => {
  it("accepts all valid seed packages", () => {
    expect(() => SeedPackageSchema.parse("standard_retail_bank")).not.toThrow()
    expect(() => SeedPackageSchema.parse("minimal_sandbox")).not.toThrow()
  })

  it("rejects invalid seed package", () => {
    expect(() => SeedPackageSchema.parse("custom_pkg")).toThrow()
  })
})

describe("PlatformModulesResponseSchema", () => {
  it("parses a valid response", () => {
    const validResponse = {
      modules: [
        {
          key: "risk_management",
          display_name: "Risk Management",
          group: "Risk",
          always_on: false,
          permissions: ["risk:read", "risk:write"],
        },
      ],
    }
    expect(() =>
      PlatformModulesResponseSchema.parse(validResponse)
    ).not.toThrow()
  })

  it("rejects module missing key field", () => {
    const invalid = {
      modules: [
        {
          display_name: "Risk Management",
          group: "Risk",
          always_on: false,
          permissions: [],
        },
      ],
    }
    expect(() => PlatformModulesResponseSchema.parse(invalid)).toThrow()
  })
})

describe("SeedPackagesResponseSchema", () => {
  it("parses a valid response", () => {
    const validResponse = {
      packages: [
        {
          key: "standard_retail_bank",
          display_name: "Standard Retail Bank",
          description: "Default configuration for retail banks",
          includes: ["Core Banking", "Risk Management"],
          available: true,
        },
      ],
    }
    expect(() => SeedPackagesResponseSchema.parse(validResponse)).not.toThrow()
  })

  it("rejects package missing required fields", () => {
    const invalid = {
      packages: [
        {
          key: "standard_retail_bank",
          // missing display_name, description, includes, available
        },
      ],
    }
    expect(() => SeedPackagesResponseSchema.parse(invalid)).toThrow()
  })
})
