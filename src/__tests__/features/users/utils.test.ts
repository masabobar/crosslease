import { describe, it, expect } from "vitest"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
  getUserActionVisibility,
  getUserListColumnVisibility,
  getUserFilterVisibility,
} from "@/features/users/utils"
import { USER_ROLES } from "@/features/users/types"

// ---------------------------------------------------------------------------
// formatLastLogin
// ---------------------------------------------------------------------------
describe("formatLastLogin", () => {
  it("returns '—' for null input", () => {
    expect(formatLastLogin(null)).toBe("—")
  })

  it("returns 'just now' for a date less than 1 minute ago", () => {
    const date = new Date(Date.now() - 30 * 1000) // 30 seconds ago
    expect(formatLastLogin(date.toISOString())).toBe("just now")
  })

  it("returns '5m ago' for a date 5 minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("5m ago")
  })

  it("returns '3h ago' for a date 3 hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("3h ago")
  })

  it("returns 'yesterday' for a date between 24 and 48 hours ago", () => {
    const date = new Date(Date.now() - 25 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("yesterday")
  })

  it("returns '3d ago' for a date 3 days ago", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("3d ago")
  })

  it("returns a non-empty locale date string for a date 10 days ago", () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatLastLogin(date.toISOString())
    expect(result).not.toBe("—")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("returns '—' for null input", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("returns a non-empty, non-dash string for a valid ISO date string", () => {
    const result = formatDate("2026-01-15T00:00:00Z")
    expect(result).not.toBe("—")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe("formatDateTime", () => {
  it("returns '—' for null input", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("returns a string containing a comma (date and time joined with ', ')", () => {
    const result = formatDateTime("2026-03-20T14:30:00Z")
    expect(result).toContain(",")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe("getInitials", () => {
  it("returns 'AM' for ('Anna', 'Müller')", () => {
    expect(getInitials("Anna", "Müller")).toBe("AM")
  })

  it("uppercases single-character inputs: ('j', 'd') → 'JD'", () => {
    expect(getInitials("j", "d")).toBe("JD")
  })

  it("returns 'XY' for ('X', 'Y')", () => {
    expect(getInitials("X", "Y")).toBe("XY")
  })
})

// ---------------------------------------------------------------------------
// getUserActionVisibility — additional cases
// ---------------------------------------------------------------------------
describe("getUserActionVisibility — additional cases", () => {
  it("returns canApprove: true when viewer=system_admin, status=pending_approval, role=system_admin (FOUR_EYES_ROLE)", () => {
    const result = getUserActionVisibility(
      "pending_approval",
      "system_admin",
      "system_admin"
    )
    expect(result.canApprove).toBe(true)
  })

  it("returns canApprove: false when viewer=system_admin, status=pending_approval, role=front_office (not a FOUR_EYES_ROLE)", () => {
    const result = getUserActionVisibility(
      "pending_approval",
      "front_office",
      "system_admin"
    )
    expect(result.canApprove).toBe(false)
  })

  it("returns all action flags false when status=deactivated and viewer=system_admin", () => {
    const result = getUserActionVisibility(
      "deactivated",
      "front_office",
      "system_admin"
    )
    expect(result.canSuspend).toBe(false)
    expect(result.canReactivate).toBe(false)
    expect(result.canDeactivate).toBe(false)
  })

  it("returns hasAnyAction: false when viewerRole is null", () => {
    const result = getUserActionVisibility("active", "front_office", null)
    expect(result.hasAnyAction).toBe(false)
  })

  it("returns hasAnyAction: false when viewerRole is front_office (non-admin)", () => {
    const result = getUserActionVisibility(
      "active",
      "front_office",
      "front_office"
    )
    expect(result.hasAnyAction).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getUserListColumnVisibility — per US-04 role-based column visibility
// ---------------------------------------------------------------------------
describe("getUserListColumnVisibility — system_admin", () => {
  it("shows all columns including accessExpiry", () => {
    const cols = getUserListColumnVisibility("system_admin")
    expect(cols.tenant).toBe(true)
    expect(cols.mfa).toBe(true)
    expect(cols.lastLogin).toBe(true)
    expect(cols.accessExpiry).toBe(true)
  })
})

describe("getUserListColumnVisibility — auditor", () => {
  it("shows all columns including accessExpiry", () => {
    const cols = getUserListColumnVisibility("auditor")
    expect(cols.tenant).toBe(true)
    expect(cols.mfa).toBe(true)
    expect(cols.lastLogin).toBe(true)
    expect(cols.accessExpiry).toBe(true)
  })
})

describe("getUserListColumnVisibility — support_user", () => {
  it("hides mfa (sensitive auth detail)", () => {
    expect(getUserListColumnVisibility("support_user").mfa).toBe(false)
  })

  it("hides lastLogin (sensitive auth detail)", () => {
    expect(getUserListColumnVisibility("support_user").lastLogin).toBe(false)
  })

  it("hides accessExpiry (not an auditor manager role)", () => {
    expect(getUserListColumnVisibility("support_user").accessExpiry).toBe(false)
  })

  it("shows tenant", () => {
    expect(getUserListColumnVisibility("support_user").tenant).toBe(true)
  })
})

describe("getUserListColumnVisibility — front_office", () => {
  it("hides tenant (always same value for tenant-scoped role)", () => {
    expect(getUserListColumnVisibility("front_office").tenant).toBe(false)
  })

  it("hides accessExpiry (not an auditor manager role)", () => {
    expect(getUserListColumnVisibility("front_office").accessExpiry).toBe(false)
  })

  it("shows mfa and lastLogin", () => {
    const cols = getUserListColumnVisibility("front_office")
    expect(cols.mfa).toBe(true)
    expect(cols.lastLogin).toBe(true)
  })
})

describe("getUserListColumnVisibility — back_office", () => {
  it("hides tenant (always same value for tenant-scoped role)", () => {
    expect(getUserListColumnVisibility("back_office").tenant).toBe(false)
  })

  it("hides accessExpiry (not an auditor manager role)", () => {
    expect(getUserListColumnVisibility("back_office").accessExpiry).toBe(false)
  })

  it("shows mfa and lastLogin", () => {
    const cols = getUserListColumnVisibility("back_office")
    expect(cols.mfa).toBe(true)
    expect(cols.lastLogin).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getUserFilterVisibility — per US-28.5 role-based filter visibility
// ---------------------------------------------------------------------------
describe("getUserFilterVisibility — system_admin", () => {
  it("shows all filters including governance", () => {
    const vis = getUserFilterVisibility("system_admin")
    expect(vis.tenant).toBe(true)
    expect(vis.lg).toBe(true)
    expect(vis.mfa).toBe(true)
    expect(vis.lastLogin).toBe(true)
    expect(vis.accessExpiry).toBe(true)
    expect(vis.auditEngagementStatus).toBe(true)
    expect(vis.systemUserFlag).toBe(true)
    expect(vis.serviceAccountFlag).toBe(true)
    expect(vis.originType).toBe(true)
    expect(vis.lastRoleChangeDate).toBe(true)
    expect(vis.lastPermissionChangeDate).toBe(true)
  })
})

describe("getUserFilterVisibility — support_user", () => {
  it("shows tenant and lg (cross-tenant role)", () => {
    const vis = getUserFilterVisibility("support_user")
    expect(vis.tenant).toBe(true)
    expect(vis.lg).toBe(true)
  })

  it("hides mfa (no MFA column for support_user)", () => {
    expect(getUserFilterVisibility("support_user").mfa).toBe(false)
  })

  it("hides lastLogin (no last login column for support_user)", () => {
    expect(getUserFilterVisibility("support_user").lastLogin).toBe(false)
  })

  it("hides accessExpiry (not an auditor-manager role)", () => {
    expect(getUserFilterVisibility("support_user").accessExpiry).toBe(false)
  })

  it("shows originType (all three management roles)", () => {
    expect(getUserFilterVisibility("support_user").originType).toBe(true)
  })

  it("hides governance-only filters: auditEngagementStatus, systemUserFlag, serviceAccountFlag, lastRoleChangeDate, lastPermissionChangeDate", () => {
    const vis = getUserFilterVisibility("support_user")
    expect(vis.auditEngagementStatus).toBe(false)
    expect(vis.systemUserFlag).toBe(false)
    expect(vis.serviceAccountFlag).toBe(false)
    expect(vis.lastRoleChangeDate).toBe(false)
    expect(vis.lastPermissionChangeDate).toBe(false)
  })
})

describe("getUserFilterVisibility — auditor", () => {
  it("hides tenant and lg (scoped to assigned tenant by backend)", () => {
    const vis = getUserFilterVisibility("auditor")
    expect(vis.tenant).toBe(false)
    expect(vis.lg).toBe(false)
  })

  it("shows mfa, lastLogin, accessExpiry", () => {
    const vis = getUserFilterVisibility("auditor")
    expect(vis.mfa).toBe(true)
    expect(vis.lastLogin).toBe(true)
    expect(vis.accessExpiry).toBe(true)
  })

  it("shows all governance filters", () => {
    const vis = getUserFilterVisibility("auditor")
    expect(vis.auditEngagementStatus).toBe(true)
    expect(vis.systemUserFlag).toBe(true)
    expect(vis.serviceAccountFlag).toBe(true)
    expect(vis.originType).toBe(true)
    expect(vis.lastRoleChangeDate).toBe(true)
    expect(vis.lastPermissionChangeDate).toBe(true)
  })
})

describe("getUserFilterVisibility — null/undefined viewerRole", () => {
  it("hides tenant, lg, accessExpiry and all governance filters when role is unknown", () => {
    const vis = getUserFilterVisibility(null)
    expect(vis.tenant).toBe(false)
    expect(vis.lg).toBe(false)
    expect(vis.accessExpiry).toBe(false)
    expect(vis.auditEngagementStatus).toBe(false)
    expect(vis.systemUserFlag).toBe(false)
    expect(vis.serviceAccountFlag).toBe(false)
    expect(vis.originType).toBe(false)
    expect(vis.lastRoleChangeDate).toBe(false)
    expect(vis.lastPermissionChangeDate).toBe(false)
  })

  it("shows mfa and lastLogin when role is unknown (no restriction confirmed)", () => {
    const vis = getUserFilterVisibility(null)
    expect(vis.mfa).toBe(true)
    expect(vis.lastLogin).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// USER_ROLES — role filter dropdown source of truth
// ---------------------------------------------------------------------------
describe("USER_ROLES — filter dropdown source of truth", () => {
  it("includes leasing_company_user (must appear in Roles filter on User Management page)", () => {
    expect(USER_ROLES).toContain("leasing_company_user")
  })

  it("contains all 6 expected roles", () => {
    expect(USER_ROLES).toContain("system_admin")
    expect(USER_ROLES).toContain("support_user")
    expect(USER_ROLES).toContain("auditor")
    expect(USER_ROLES).toContain("front_office")
    expect(USER_ROLES).toContain("back_office")
    expect(USER_ROLES).toContain("leasing_company_user")
    expect(USER_ROLES.length).toBe(6)
  })
})

describe("getUserListColumnVisibility — null/undefined viewerRole", () => {
  it("hides accessExpiry when role is null (no confirmed auditor context)", () => {
    expect(getUserListColumnVisibility(null).accessExpiry).toBe(false)
  })

  it("hides accessExpiry when role is undefined", () => {
    expect(getUserListColumnVisibility(undefined).accessExpiry).toBe(false)
  })

  it("shows tenant, mfa, lastLogin when role is null", () => {
    const cols = getUserListColumnVisibility(null)
    expect(cols.tenant).toBe(true)
    expect(cols.mfa).toBe(true)
    expect(cols.lastLogin).toBe(true)
  })
})
