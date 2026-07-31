import { describe, it, expect } from "vitest"
import { getTenantDetailTabVisibility } from "@/features/tenants/utils"
import type { TenantDetailViewer } from "@/features/tenants/utils"
import {
  TENANT_CREATE_ALLOWED_ROLES,
  TENANT_DETAIL_ALLOWED_ROLES,
  TENANT_LIST_ALLOWED_ROLES,
} from "@/features/tenants/types"

const OWN_TENANT = "11111111-1111-1111-1111-111111111111"
const OTHER_TENANT = "22222222-2222-2222-2222-222222222222"
const FUTURE = "2099-01-01T00:00:00Z"
const PAST = "2000-01-01T00:00:00Z"

function viewer(overrides: Partial<TenantDetailViewer>): TenantDetailViewer {
  return {
    role: null,
    tenantId: null,
    accessValidUntil: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tenant access role constants — per the US 29.3 / 29.4 permission matrices
// ---------------------------------------------------------------------------
describe("tenant access role constants", () => {
  it("keeps the tenant list to System Admin and Support User (US 29.3)", () => {
    expect(TENANT_LIST_ALLOWED_ROLES).toEqual(["system_admin", "support_user"])
    // The Bank Admin has exactly one tenant, so it gets a direct link, not a list —
    // GET /tenants answers 404 for the role.
    expect(TENANT_LIST_ALLOWED_ROLES).not.toContain("bank_power_user")
  })

  it("admits the Bank Admin to tenant detail (US 29.4: R, own tenant)", () => {
    expect(TENANT_DETAIL_ALLOWED_ROLES).toContain("bank_power_user")
  })

  it("keeps tenant creation to System Admin", () => {
    expect(TENANT_CREATE_ALLOWED_ROLES).toEqual(["system_admin"])
  })

  it("excludes operational and LC roles from tenant detail", () => {
    for (const role of [
      "front_office",
      "back_office",
      "leasing_company_user",
    ] as const) {
      expect(TENANT_DETAIL_ALLOWED_ROLES).not.toContain(role)
    }
  })
})

// ---------------------------------------------------------------------------
// getTenantDetailTabVisibility
// ---------------------------------------------------------------------------
describe("getTenantDetailTabVisibility — system_admin", () => {
  it("sees every tab", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "system_admin" }),
      OWN_TENANT
    )
    expect(tabs).toEqual({
      overview: true,
      modules: true,
      governance: true,
      grants: true,
      licence_limits: true,
    })
  })
})

describe("getTenantDetailTabVisibility — bank_power_user", () => {
  it("sees Identity & Status and Module Profile on its own tenant", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "bank_power_user", tenantId: OWN_TENANT }),
      OWN_TENANT
    )
    expect(tabs.overview).toBe(true)
    expect(tabs.modules).toBe(true)
  })

  it("sees no governance, grants or licence limits tab", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "bank_power_user", tenantId: OWN_TENANT }),
      OWN_TENANT
    )
    expect(tabs.governance).toBe(false)
    expect(tabs.grants).toBe(false)
    expect(tabs.licence_limits).toBe(false)
  })

  it("sees nothing on another tenant", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "bank_power_user", tenantId: OWN_TENANT }),
      OTHER_TENANT
    )
    expect(Object.values(tabs).every(visible => !visible)).toBe(true)
  })

  it("sees nothing when it has no home tenant", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "bank_power_user", tenantId: null }),
      OWN_TENANT
    )
    expect(Object.values(tabs).every(visible => !visible)).toBe(true)
  })
})

describe("getTenantDetailTabVisibility — support_user", () => {
  it("sees Identity & Status and Module Profile on any tenant it can reach", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "support_user" }),
      OTHER_TENANT
    )
    expect(tabs.overview).toBe(true)
    expect(tabs.modules).toBe(true)
    expect(tabs.governance).toBe(false)
    expect(tabs.grants).toBe(false)
  })
})

describe("getTenantDetailTabVisibility — auditor", () => {
  it("sees Governance History only, on its own tenant, inside the engagement window", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({
        role: "auditor",
        tenantId: OWN_TENANT,
        accessValidUntil: FUTURE,
      }),
      OWN_TENANT
    )
    expect(tabs.governance).toBe(true)
    expect(tabs.overview).toBe(false)
    expect(tabs.modules).toBe(false)
  })

  it("sees nothing once the engagement window has expired", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({ role: "auditor", tenantId: OWN_TENANT, accessValidUntil: PAST }),
      OWN_TENANT
    )
    expect(Object.values(tabs).every(visible => !visible)).toBe(true)
  })

  it("sees nothing on a tenant outside its engagement", () => {
    const tabs = getTenantDetailTabVisibility(
      viewer({
        role: "auditor",
        tenantId: OWN_TENANT,
        accessValidUntil: FUTURE,
      }),
      OTHER_TENANT
    )
    expect(Object.values(tabs).every(visible => !visible)).toBe(true)
  })
})

describe("getTenantDetailTabVisibility — roles with no tenant detail access", () => {
  it("shows no tab to operational and LC roles, or to an unknown viewer", () => {
    for (const role of [
      "front_office",
      "back_office",
      "leasing_company_user",
      null,
      undefined,
    ] as const) {
      const tabs = getTenantDetailTabVisibility(
        viewer({ role, tenantId: OWN_TENANT }),
        OWN_TENANT
      )
      expect(Object.values(tabs).every(visible => !visible)).toBe(true)
    }
  })
})
