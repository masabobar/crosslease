import { describe, it, expect } from "vitest"
import {
  CreateTenantFormSchema,
  PlatformModulesResponseSchema,
  SeedPackagesResponseSchema,
  TenantListItemSchema,
  TenantsResponseSchema,
  TenantTypeSchema,
  SeedPackageSchema,
  TenantResponseSchema,
  TenantSupportResponseSchema,
  TenantDetailSchema,
  isFullTenantResponse,
  TenantModuleEntrySchema,
  TenantDetailModulesResponseSchema,
  GovernanceHistoryEventSchema,
  SupportGrantSchema,
  AccessPolicyResponseSchema,
  IntegrationBindingResponseSchema,
  ArchiveTenantFormSchema,
  createArchiveTenantFormSchema,
  CreateGrantFormSchema,
  RevokeGrantFormSchema,
  UpsertIntegrationBindingFormSchema,
  UpdateAccessPolicyFormSchema,
  UpdateTenantFormSchema,
  createUpdateTenantFormSchema,
  ModuleActivateFormSchema,
  ModuleDeactivateFormSchema,
  SuspendTenantFormSchema,
  EditLicenceLimitsFormSchema,
  ReactivateTenantFormSchema,
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

  it("accepts a list item without created_at", () => {
    expect(() => TenantListItemSchema.parse(validTenantListItem)).not.toThrow()
  })

  it("accepts a list item with created_at", () => {
    expect(() =>
      TenantListItemSchema.parse({
        ...validTenantListItem,
        created_at: "2026-01-01T00:00:00Z",
      })
    ).not.toThrow()
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
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      description: _d,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const validTenantResponse = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  tenant_id: "TNT-00001",
  name: "First National Bank",
  code: "FNB",
  legal_entity_name: "First National Bank AG",
  country: "DE",
  default_currency: "EUR",
  tenant_type: "bank",
  description: null,
  seed_package: "standard_retail_bank",
  core_banking_integration_ref: null,
  status: "active",
  legal_hold_flag: false,
  activated_at: null,
  mfa_required: false,
  max_lc_count: 10,
  max_bank_user_count: 10,
  max_users_per_lc: 10,
  lc_utilisation: 0,
  bank_user_utilisation: 0,
  lc_user_highest_active: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by: null,
  approved_by: null,
}

describe("TenantResponseSchema", () => {
  it("accepts a valid full tenant response", () => {
    expect(() => TenantResponseSchema.parse(validTenantResponse)).not.toThrow()
  })

  it("rejects unknown status", () => {
    expect(() =>
      TenantResponseSchema.parse({
        ...validTenantResponse,
        status: "unknown_status",
      })
    ).toThrow()
  })

  it("rejects unknown tenant_type", () => {
    expect(() =>
      TenantResponseSchema.parse({
        ...validTenantResponse,
        tenant_type: "cooperative",
      })
    ).toThrow()
  })

  it("rejects created_at that is not a datetime string", () => {
    expect(() =>
      TenantResponseSchema.parse({
        ...validTenantResponse,
        created_at: "not-a-date",
      })
    ).toThrow()
  })

  it("rejects missing max_lc_count field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { max_lc_count, ...rest } = validTenantResponse
    expect(() => TenantResponseSchema.parse(rest)).toThrow()
  })

  it("rejects legal_hold_flag as string", () => {
    expect(() =>
      TenantResponseSchema.parse({
        ...validTenantResponse,
        legal_hold_flag: "true",
      })
    ).toThrow()
  })
})

const validTenantSupportResponse = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  name: "First National Bank",
  code: "FNB",
  tenant_type: "bank",
  status: "active",
  country: "DE",
  default_currency: "EUR",
  activated_at: null,
  created_at: "2026-01-01T00:00:00Z",
}

describe("TenantDetailSchema", () => {
  it("accepts a full tenant response (admin)", () => {
    expect(() => TenantDetailSchema.parse(validTenantResponse)).not.toThrow()
  })

  it("accepts a support tenant response", () => {
    expect(() =>
      TenantDetailSchema.parse(validTenantSupportResponse)
    ).not.toThrow()
  })

  it("rejects an object matching neither shape", () => {
    expect(() =>
      TenantDetailSchema.parse({ id: "not-a-uuid", name: "Incomplete" })
    ).toThrow()
  })
})

describe("isFullTenantResponse", () => {
  it("returns true for a full tenant response", () => {
    const parsed = TenantResponseSchema.parse(validTenantResponse)
    expect(isFullTenantResponse(parsed)).toBe(true)
  })

  it("returns false for a support tenant response", () => {
    const parsed = TenantSupportResponseSchema.parse(validTenantSupportResponse)
    expect(isFullTenantResponse(parsed)).toBe(false)
  })
})

const validTenantModuleEntry = {
  key: "risk_management",
  display_name: "Risk Management",
  group: "Risk",
  always_on: false,
  status: "active",
  activated_at: "2026-01-01T00:00:00Z",
}

describe("TenantModuleEntrySchema", () => {
  it("accepts a valid module entry", () => {
    expect(() =>
      TenantModuleEntrySchema.parse(validTenantModuleEntry)
    ).not.toThrow()
  })

  it("accepts a missing activated_at field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activated_at, ...rest } = validTenantModuleEntry
    expect(() => TenantModuleEntrySchema.parse(rest)).not.toThrow()
  })

  it("accepts all module status values", () => {
    for (const status of [
      "active",
      "inactive",
      "pending_activation",
      "pending_enforcement",
      "pending_deactivation",
    ] as const) {
      expect(() =>
        TenantModuleEntrySchema.parse({ ...validTenantModuleEntry, status })
      ).not.toThrow()
    }
  })

  it("rejects unknown status value", () => {
    expect(() =>
      TenantModuleEntrySchema.parse({
        ...validTenantModuleEntry,
        status: "unknown_status",
      })
    ).toThrow()
  })

  it("rejects missing key field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, ...rest } = validTenantModuleEntry
    expect(() => TenantModuleEntrySchema.parse(rest)).toThrow()
  })
})

describe("TenantDetailModulesResponseSchema", () => {
  it("parses a valid response", () => {
    expect(() =>
      TenantDetailModulesResponseSchema.parse({
        modules: [validTenantModuleEntry],
      })
    ).not.toThrow()
  })

  it("accepts an empty modules array", () => {
    expect(() =>
      TenantDetailModulesResponseSchema.parse({ modules: [] })
    ).not.toThrow()
  })

  it("rejects a modules entry with an invalid status", () => {
    expect(() =>
      TenantDetailModulesResponseSchema.parse({
        modules: [{ ...validTenantModuleEntry, status: "unknown_status" }],
      })
    ).toThrow()
  })

  it("rejects missing modules field", () => {
    expect(() => TenantDetailModulesResponseSchema.parse({})).toThrow()
  })
})

const validGovernanceEvent = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  event_type: "tenant.activated",
  actor_display: "System Admin",
  old_data: null,
  new_data: { status: "active" },
  reason: null,
  recorded_at: "2026-01-01T00:00:00Z",
}

describe("GovernanceHistoryEventSchema", () => {
  it("accepts a valid event", () => {
    expect(() =>
      GovernanceHistoryEventSchema.parse(validGovernanceEvent)
    ).not.toThrow()
  })

  it("accepts null actor_display, old_data, new_data, and reason", () => {
    expect(() =>
      GovernanceHistoryEventSchema.parse({
        ...validGovernanceEvent,
        actor_display: null,
        old_data: null,
        new_data: null,
        reason: null,
      })
    ).not.toThrow()
  })

  it("rejects invalid uuid for id", () => {
    expect(() =>
      GovernanceHistoryEventSchema.parse({
        ...validGovernanceEvent,
        id: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects missing event_type field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { event_type, ...rest } = validGovernanceEvent
    expect(() => GovernanceHistoryEventSchema.parse(rest)).toThrow()
  })

  it("rejects recorded_at that is not a datetime string", () => {
    expect(() =>
      GovernanceHistoryEventSchema.parse({
        ...validGovernanceEvent,
        recorded_at: "yesterday",
      })
    ).toThrow()
  })
})

const validSupportGrant = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  tenant_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e",
  grantee_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5f",
  granted_by: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c60",
  access_reason: "user_access_issue",
  valid_from: "2026-01-01T00:00:00Z",
  valid_until: "2026-01-31T00:00:00Z",
  status: "active",
  additional_context: null,
  revocation_reason: null,
  revoked_by: null,
  revoked_at: null,
  is_emergency: false,
  review_required_by: null,
  review_completed_at: null,
  reviewed_by: null,
  review_outcome: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("SupportGrantSchema", () => {
  it("accepts a valid grant", () => {
    expect(() => SupportGrantSchema.parse(validSupportGrant)).not.toThrow()
  })

  it("accepts all grant status values", () => {
    for (const status of ["active", "expired", "revoked"] as const) {
      expect(() =>
        SupportGrantSchema.parse({ ...validSupportGrant, status })
      ).not.toThrow()
    }
  })

  it("rejects unknown status", () => {
    expect(() =>
      SupportGrantSchema.parse({ ...validSupportGrant, status: "pending" })
    ).toThrow()
  })

  it("rejects unknown access_reason", () => {
    expect(() =>
      SupportGrantSchema.parse({
        ...validSupportGrant,
        access_reason: "curiosity",
      })
    ).toThrow()
  })

  it("rejects missing grantee_id field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { grantee_id, ...rest } = validSupportGrant
    expect(() => SupportGrantSchema.parse(rest)).toThrow()
  })

  it("rejects invalid uuid for grantee_id", () => {
    expect(() =>
      SupportGrantSchema.parse({
        ...validSupportGrant,
        grantee_id: "not-a-uuid",
      })
    ).toThrow()
  })
})

const validAccessPolicyFlag = {
  enabled: true,
  modified_by: null,
  modified_at: null,
}

const validAccessPolicy = {
  support_read_only_access: validAccessPolicyFlag,
  auditor_access: validAccessPolicyFlag,
  lc_portal: validAccessPolicyFlag,
}

describe("AccessPolicyResponseSchema", () => {
  it("accepts a valid access policy response", () => {
    expect(() =>
      AccessPolicyResponseSchema.parse(validAccessPolicy)
    ).not.toThrow()
  })

  it("rejects missing auditor_access field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { auditor_access, ...rest } = validAccessPolicy
    expect(() => AccessPolicyResponseSchema.parse(rest)).toThrow()
  })

  it("rejects enabled as string", () => {
    expect(() =>
      AccessPolicyResponseSchema.parse({
        ...validAccessPolicy,
        lc_portal: { ...validAccessPolicyFlag, enabled: "true" },
      })
    ).toThrow()
  })
})

const validIntegrationBinding = {
  id: null,
  tenant_id: null,
  endpoint_url: null,
  integration_active: null,
  credential_scope_identifier: null,
  disbursement_execution_boundary_note: null,
  created_by: null,
  created_at: null,
  last_modified_by: null,
  updated_at: null,
  decommission_timestamp: null,
}

describe("IntegrationBindingResponseSchema", () => {
  it("accepts an all-null (not configured) response", () => {
    expect(() =>
      IntegrationBindingResponseSchema.parse(validIntegrationBinding)
    ).not.toThrow()
  })

  it("accepts a populated binding", () => {
    expect(() =>
      IntegrationBindingResponseSchema.parse({
        ...validIntegrationBinding,
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        tenant_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e",
        endpoint_url: "https://example.com/webhook",
        integration_active: true,
        credential_scope_identifier: "scope-1",
        created_at: "2026-01-01T00:00:00Z",
      })
    ).not.toThrow()
  })

  it("rejects missing endpoint_url field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { endpoint_url, ...rest } = validIntegrationBinding
    expect(() => IntegrationBindingResponseSchema.parse(rest)).toThrow()
  })

  it("rejects invalid uuid for id", () => {
    expect(() =>
      IntegrationBindingResponseSchema.parse({
        ...validIntegrationBinding,
        id: "not-a-uuid",
      })
    ).toThrow()
  })
})

const validArchiveForm = {
  justification: "x".repeat(50),
  irreversibility_acknowledgement: true,
  active_user_acknowledgement: false,
}

describe("ArchiveTenantFormSchema", () => {
  it("accepts a valid form", () => {
    expect(() => ArchiveTenantFormSchema.parse(validArchiveForm)).not.toThrow()
  })

  it("rejects justification shorter than 50 characters", () => {
    expect(() =>
      ArchiveTenantFormSchema.parse({
        ...validArchiveForm,
        justification: "too short",
      })
    ).toThrow()
  })

  it("rejects irreversibility_acknowledgement set to false", () => {
    expect(() =>
      ArchiveTenantFormSchema.parse({
        ...validArchiveForm,
        irreversibility_acknowledgement: false,
      })
    ).toThrow()
  })

  it("accepts a missing active_user_acknowledgement field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { active_user_acknowledgement, ...rest } = validArchiveForm
    expect(() => ArchiveTenantFormSchema.parse(rest)).not.toThrow()
  })
})

describe("createArchiveTenantFormSchema", () => {
  it("does not require active_user_acknowledgement when there are no active users", () => {
    const schema = createArchiveTenantFormSchema(false)
    expect(() =>
      schema.parse({
        justification: "x".repeat(50),
        irreversibility_acknowledgement: true,
        active_user_acknowledgement: false,
      })
    ).not.toThrow()
  })

  it("requires active_user_acknowledgement to be true when there are active users", () => {
    const schema = createArchiveTenantFormSchema(true)
    expect(() =>
      schema.parse({
        justification: "x".repeat(50),
        irreversibility_acknowledgement: true,
        active_user_acknowledgement: false,
      })
    ).toThrow()
  })

  it("accepts active_user_acknowledgement true when there are active users", () => {
    const schema = createArchiveTenantFormSchema(true)
    expect(() =>
      schema.parse({
        justification: "x".repeat(50),
        irreversibility_acknowledgement: true,
        active_user_acknowledgement: true,
      })
    ).not.toThrow()
  })
})

const validCreateGrantForm = {
  grantee_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  access_reason: "user_access_issue",
  valid_from: "2026-01-01",
  valid_until: "2026-01-15",
  additional_context: null,
}

describe("CreateGrantFormSchema", () => {
  it("accepts a valid form", () => {
    expect(() =>
      CreateGrantFormSchema.parse(validCreateGrantForm)
    ).not.toThrow()
  })

  it("rejects an invalid uuid for grantee_id", () => {
    expect(() =>
      CreateGrantFormSchema.parse({
        ...validCreateGrantForm,
        grantee_id: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects unknown access_reason", () => {
    expect(() =>
      CreateGrantFormSchema.parse({
        ...validCreateGrantForm,
        access_reason: "curiosity",
      })
    ).toThrow()
  })

  it("rejects empty valid_from", () => {
    expect(() =>
      CreateGrantFormSchema.parse({ ...validCreateGrantForm, valid_from: "" })
    ).toThrow()
  })

  it("accepts a missing additional_context field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { additional_context, ...rest } = validCreateGrantForm
    expect(() => CreateGrantFormSchema.parse(rest)).not.toThrow()
  })
})

describe("RevokeGrantFormSchema", () => {
  it("accepts a valid revocation reason", () => {
    expect(() =>
      RevokeGrantFormSchema.parse({ revocation_reason: "x".repeat(10) })
    ).not.toThrow()
  })

  it("rejects a revocation reason shorter than 10 characters", () => {
    expect(() =>
      RevokeGrantFormSchema.parse({ revocation_reason: "short" })
    ).toThrow()
  })
})

const validBindingForm = {
  endpoint_url: "https://example.com/webhook",
  credential_scope_identifier: "scope-1",
  integration_active: true,
  disbursement_execution_boundary_note: "note",
  justification: "x".repeat(20),
}

describe("UpsertIntegrationBindingFormSchema", () => {
  it("accepts a valid form", () => {
    expect(() =>
      UpsertIntegrationBindingFormSchema.parse(validBindingForm)
    ).not.toThrow()
  })

  it("rejects a non-https endpoint_url", () => {
    expect(() =>
      UpsertIntegrationBindingFormSchema.parse({
        ...validBindingForm,
        endpoint_url: "http://example.com/webhook",
      })
    ).toThrow()
  })

  it("rejects a malformed endpoint_url", () => {
    expect(() =>
      UpsertIntegrationBindingFormSchema.parse({
        ...validBindingForm,
        endpoint_url: "not-a-url",
      })
    ).toThrow()
  })

  it("rejects missing credential_scope_identifier", () => {
    expect(() =>
      UpsertIntegrationBindingFormSchema.parse({
        ...validBindingForm,
        credential_scope_identifier: "",
      })
    ).toThrow()
  })

  it("rejects justification shorter than 20 characters", () => {
    expect(() =>
      UpsertIntegrationBindingFormSchema.parse({
        ...validBindingForm,
        justification: "too short",
      })
    ).toThrow()
  })

  it("accepts a missing disbursement_execution_boundary_note field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { disbursement_execution_boundary_note, ...rest } = validBindingForm
    expect(() => UpsertIntegrationBindingFormSchema.parse(rest)).not.toThrow()
  })
})

const validUpdatePolicyForm = {
  support_read_only_access_allowed: true,
  auditor_access_allowed: false,
  lc_portal_enabled: true,
  reason: "x".repeat(20),
}

describe("UpdateAccessPolicyFormSchema", () => {
  it("accepts a valid form", () => {
    expect(() =>
      UpdateAccessPolicyFormSchema.parse(validUpdatePolicyForm)
    ).not.toThrow()
  })

  it("rejects reason shorter than 20 characters", () => {
    expect(() =>
      UpdateAccessPolicyFormSchema.parse({
        ...validUpdatePolicyForm,
        reason: "too short",
      })
    ).toThrow()
  })

  it("rejects missing lc_portal_enabled field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lc_portal_enabled, ...rest } = validUpdatePolicyForm
    expect(() => UpdateAccessPolicyFormSchema.parse(rest)).toThrow()
  })
})

const validUpdateTenantForm = {
  name: "Updated Bank Name",
  legal_entity_name: "Updated Bank AG",
  description: "desc",
  legal_hold_flag: false,
  justification: undefined,
}

describe("UpdateTenantFormSchema", () => {
  it("accepts a valid form", () => {
    expect(() =>
      UpdateTenantFormSchema.parse(validUpdateTenantForm)
    ).not.toThrow()
  })

  it("rejects a name shorter than 2 characters", () => {
    expect(() =>
      UpdateTenantFormSchema.parse({ ...validUpdateTenantForm, name: "A" })
    ).toThrow()
  })

  it("rejects an empty legal_entity_name", () => {
    expect(() =>
      UpdateTenantFormSchema.parse({
        ...validUpdateTenantForm,
        legal_entity_name: "",
      })
    ).toThrow()
  })
})

describe("createUpdateTenantFormSchema", () => {
  it("does not require justification when the name is unchanged", () => {
    const schema = createUpdateTenantFormSchema("Original Bank Name")
    expect(() =>
      schema.parse({ ...validUpdateTenantForm, name: "Original Bank Name" })
    ).not.toThrow()
  })

  it("requires a justification of at least 20 characters when the name changes", () => {
    const schema = createUpdateTenantFormSchema("Original Bank Name")
    expect(() =>
      schema.parse({ ...validUpdateTenantForm, justification: "too short" })
    ).toThrow()
  })

  it("accepts a name change with a sufficiently long justification", () => {
    const schema = createUpdateTenantFormSchema("Original Bank Name")
    expect(() =>
      schema.parse({
        ...validUpdateTenantForm,
        justification: "x".repeat(20),
      })
    ).not.toThrow()
  })
})

describe("ModuleActivateFormSchema", () => {
  it("accepts a valid justification", () => {
    expect(() =>
      ModuleActivateFormSchema.parse({ justification: "x".repeat(10) })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 10 characters", () => {
    expect(() =>
      ModuleActivateFormSchema.parse({ justification: "short" })
    ).toThrow()
  })
})

describe("ModuleDeactivateFormSchema", () => {
  it("accepts a valid justification", () => {
    expect(() =>
      ModuleDeactivateFormSchema.parse({ justification: "x".repeat(20) })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 20 characters", () => {
    expect(() =>
      ModuleDeactivateFormSchema.parse({ justification: "too short" })
    ).toThrow()
  })
})

describe("SuspendTenantFormSchema", () => {
  it("accepts a valid justification", () => {
    expect(() =>
      SuspendTenantFormSchema.parse({ justification: "x".repeat(30) })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 30 characters", () => {
    expect(() =>
      SuspendTenantFormSchema.parse({ justification: "too short" })
    ).toThrow()
  })
})

describe("EditLicenceLimitsFormSchema", () => {
  const validLimits = {
    max_lc_count: 5,
    max_bank_user_count: 5,
    max_users_per_lc: 5,
  }

  it("accepts valid limits", () => {
    expect(() => EditLicenceLimitsFormSchema.parse(validLimits)).not.toThrow()
  })

  it("rejects max_lc_count below 1", () => {
    expect(() =>
      EditLicenceLimitsFormSchema.parse({ ...validLimits, max_lc_count: 0 })
    ).toThrow()
  })

  it("rejects a non-integer max_bank_user_count", () => {
    expect(() =>
      EditLicenceLimitsFormSchema.parse({
        ...validLimits,
        max_bank_user_count: 5.5,
      })
    ).toThrow()
  })
})

describe("ReactivateTenantFormSchema", () => {
  it("accepts a valid justification", () => {
    expect(() =>
      ReactivateTenantFormSchema.parse({ justification: "x".repeat(20) })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 20 characters", () => {
    expect(() =>
      ReactivateTenantFormSchema.parse({ justification: "too short" })
    ).toThrow()
  })
})
