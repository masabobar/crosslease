import { describe, it, expect } from "vitest"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
} from "@/lib/formatters"
import {
  buildActionToastPayload,
  buildIdentityPatch,
  getRoleClassificationKey,
  getUserActionVisibility,
  getUserListColumnVisibility,
  getUserFilterVisibility,
} from "@/features/users/utils"
import {
  AUDITOR_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  LEASING_COMPANY_USER_ROLE,
  PLATFORM_USER_ROLES,
  SUPPORT_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
  BANK_ADMIN_INVITABLE_ROLES,
  USER_APPROVE_ROLES,
  USER_EXPORT_ROLES,
  USER_IDENTITY_EDIT_ROLES,
  USER_INVITE_ROLES,
  USER_LIFECYCLE_ACTION_ROLES,
  USER_ROLE_CHANGE_ROLES,
  USER_ROLES,
} from "@/features/users/types"

// ---------------------------------------------------------------------------
// formatLastLogin
// ---------------------------------------------------------------------------
function mockT(key: string, options?: Record<string, unknown>): string {
  const map: Record<string, string> = {
    "time.justNow": "just now",
    "time.yesterday": "yesterday",
  }
  if (key === "time.minutesAgo") return `${options?.count}m ago`
  if (key === "time.hoursAgo") return `${options?.count}h ago`
  if (key === "time.daysAgo") return `${options?.count}d ago`
  return map[key] ?? key
}

describe("formatLastLogin", () => {
  it("returns '—' for null input", () => {
    expect(formatLastLogin(null, mockT)).toBe("—")
  })

  it("returns 'just now' for a date less than 1 minute ago", () => {
    const date = new Date(Date.now() - 30 * 1000) // 30 seconds ago
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("just now")
  })

  it("returns '5m ago' for a date 5 minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("5m ago")
  })

  it("returns '3h ago' for a date 3 hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("3h ago")
  })

  it("returns 'yesterday' for a date between 24 and 48 hours ago", () => {
    const date = new Date(Date.now() - 25 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("yesterday")
  })

  it("returns '3d ago' for a date 3 days ago", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("3d ago")
  })

  it("returns a non-empty locale date string for a date 10 days ago", () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatLastLogin(date.toISOString(), mockT)
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
// getUserActionVisibility — canResetMfa
// ---------------------------------------------------------------------------
describe("getUserActionVisibility — canResetMfa", () => {
  it("returns canResetMfa: true for system_admin viewing active user", () => {
    expect(
      getUserActionVisibility("active", "front_office", "system_admin")
        .canResetMfa
    ).toBe(true)
  })

  it("returns canResetMfa: true for system_admin viewing suspended user", () => {
    expect(
      getUserActionVisibility("suspended", "front_office", "system_admin")
        .canResetMfa
    ).toBe(true)
  })

  it("returns canResetMfa: false for system_admin viewing deactivated user", () => {
    expect(
      getUserActionVisibility("deactivated", "front_office", "system_admin")
        .canResetMfa
    ).toBe(false)
  })

  it("returns canResetMfa: false for system_admin viewing invited user", () => {
    expect(
      getUserActionVisibility("invited", "front_office", "system_admin")
        .canResetMfa
    ).toBe(false)
  })

  it("returns canResetMfa: false for non-admin viewer", () => {
    expect(
      getUserActionVisibility("active", "front_office", "support_user")
        .canResetMfa
    ).toBe(false)
  })

  it("returns canResetMfa: false when viewerRole is null", () => {
    expect(
      getUserActionVisibility("active", "front_office", null).canResetMfa
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getUserActionVisibility — bank_power_user (Bank Admin)
//
// Per US-28.8 the Bank Admin administers onboarding for its own tenant, and the
// backend grants it user:suspend / :reactivate / :deactivate / :resend_invitation /
// :mfa_reset (scoped to that tenant). Approving is Four-Eyes on platform roles only,
// which the Bank Admin never holds.
// ---------------------------------------------------------------------------
describe("getUserActionVisibility — bank_power_user", () => {
  it("allows suspend on an active tenant user", () => {
    const result = getUserActionVisibility(
      "active",
      "front_office",
      "bank_power_user"
    )
    expect(result.canSuspend).toBe(true)
    expect(result.canDeactivate).toBe(true)
    expect(result.canResetMfa).toBe(true)
    expect(result.canReactivate).toBe(false)
  })

  it("allows reactivate on a suspended tenant user", () => {
    const result = getUserActionVisibility(
      "suspended",
      "back_office",
      "bank_power_user"
    )
    expect(result.canReactivate).toBe(true)
    expect(result.canDeactivate).toBe(true)
    expect(result.canSuspend).toBe(false)
  })

  it("allows resend invitation on an invited tenant user", () => {
    const result = getUserActionVisibility(
      "invited",
      "leasing_company_user",
      "bank_power_user"
    )
    expect(result.canResendInvitation).toBe(true)
  })

  it("never allows approve — Four-Eyes on platform roles is system_admin-only", () => {
    expect(
      getUserActionVisibility(
        "pending_approval",
        "system_admin",
        "bank_power_user"
      ).canApprove
    ).toBe(false)
    expect(
      getUserActionVisibility("pending_approval", "auditor", "bank_power_user")
        .canApprove
    ).toBe(false)
  })

  it("offers no action on a deactivated user", () => {
    expect(
      getUserActionVisibility("deactivated", "front_office", "bank_power_user")
        .hasAnyAction
    ).toBe(false)
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

  it("contains all 7 expected roles", () => {
    expect(USER_ROLES).toContain("system_admin")
    expect(USER_ROLES).toContain("support_user")
    expect(USER_ROLES).toContain("auditor")
    expect(USER_ROLES).toContain("bank_power_user")
    expect(USER_ROLES).toContain("front_office")
    expect(USER_ROLES).toContain("back_office")
    expect(USER_ROLES).toContain("leasing_company_user")
    expect(USER_ROLES.length).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// User administration role constants — must mirror the backend permission matrix
// (refinext-api/src/app/shared/permissions/matrix.py). A role listed here without
// the matching backend grant produces a control that always fails with 403/404.
// ---------------------------------------------------------------------------
describe("user administration role constants", () => {
  it("grants invite, lifecycle actions, identity edit and export to the Bank Admin", () => {
    expect(USER_INVITE_ROLES).toContain("bank_power_user")
    expect(USER_LIFECYCLE_ACTION_ROLES).toContain("bank_power_user")
    expect(USER_IDENTITY_EDIT_ROLES).toContain("bank_power_user")
    expect(USER_EXPORT_ROLES).toContain("bank_power_user")
  })

  it("withholds role change and approve from the Bank Admin — it holds neither permission", () => {
    expect(USER_ROLE_CHANGE_ROLES).not.toContain("bank_power_user")
    expect(USER_APPROVE_ROLES).not.toContain("bank_power_user")
    expect(USER_ROLE_CHANGE_ROLES).toEqual(["system_admin"])
    expect(USER_APPROVE_ROLES).toEqual(["system_admin"])
  })

  it("withholds every administration action from read-only and operational roles", () => {
    for (const role of [
      "support_user",
      "front_office",
      "back_office",
      "leasing_company_user",
    ] as const) {
      expect(USER_INVITE_ROLES).not.toContain(role)
      expect(USER_LIFECYCLE_ACTION_ROLES).not.toContain(role)
      expect(USER_IDENTITY_EDIT_ROLES).not.toContain(role)
    }
  })

  it("exports the user list for auditor but nothing else", () => {
    expect(USER_EXPORT_ROLES).toContain("auditor")
    expect(USER_LIFECYCLE_ACTION_ROLES).not.toContain("auditor")
    expect(USER_INVITE_ROLES).not.toContain("auditor")
  })

  it("lets the Bank Admin invite only tenant-operational roles", () => {
    expect(BANK_ADMIN_INVITABLE_ROLES).toEqual([
      "front_office",
      "back_office",
      "leasing_company_user",
    ])
    // Platform roles and bank_power_user itself are system_admin-only — the backend
    // answers 403 INVITE_ROLE_NOT_PERMITTED.
    expect(BANK_ADMIN_INVITABLE_ROLES).not.toContain("bank_power_user")
    expect(BANK_ADMIN_INVITABLE_ROLES).not.toContain("system_admin")
    expect(BANK_ADMIN_INVITABLE_ROLES).not.toContain("support_user")
    expect(BANK_ADMIN_INVITABLE_ROLES).not.toContain("auditor")
  })

  it("keeps every invitable role inside USER_ROLES", () => {
    for (const role of BANK_ADMIN_INVITABLE_ROLES) {
      expect(USER_ROLES).toContain(role)
    }
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

// ---------------------------------------------------------------------------
// getRoleClassificationKey
// ---------------------------------------------------------------------------

describe("getRoleClassificationKey", () => {
  it("classifies every platform role as platform", () => {
    for (const role of PLATFORM_USER_ROLES) {
      expect(getRoleClassificationKey(role)).toBe(
        "detail.page.roleClassification.platform"
      )
    }
  })

  it("classifies system_admin, support_user and auditor as platform", () => {
    expect(getRoleClassificationKey(SYSTEM_ADMIN_ROLE)).toBe(
      "detail.page.roleClassification.platform"
    )
    expect(getRoleClassificationKey(SUPPORT_USER_ROLE)).toBe(
      "detail.page.roleClassification.platform"
    )
    expect(getRoleClassificationKey(AUDITOR_ROLE)).toBe(
      "detail.page.roleClassification.platform"
    )
  })

  it("classifies tenant-operational roles as tenantOperational", () => {
    for (const role of [
      BANK_POWER_USER_ROLE,
      FRONT_OFFICE_ROLE,
      BACK_OFFICE_ROLE,
      LEASING_COMPANY_USER_ROLE,
    ]) {
      expect(getRoleClassificationKey(role)).toBe(
        "detail.page.roleClassification.tenantOperational"
      )
    }
  })

  it("returns one of exactly two keys for every role", () => {
    const keys = new Set(USER_ROLES.map(getRoleClassificationKey))
    expect(keys.size).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// buildActionToastPayload
// ---------------------------------------------------------------------------

describe("buildActionToastPayload", () => {
  const echoT = (key: string, options?: Record<string, unknown>) =>
    options?.name ? `${key}:${String(options.name)}` : key

  it("uses the warning variant for suspend and deactivate", () => {
    expect(buildActionToastPayload("suspend", "Ana B", echoT).variant).toBe(
      "warning"
    )
    expect(buildActionToastPayload("deactivate", "Ana B", echoT).variant).toBe(
      "warning"
    )
  })

  it("uses the success variant for reactivate and resend-invitation", () => {
    expect(buildActionToastPayload("reactivate", "Ana B", echoT).variant).toBe(
      "success"
    )
    expect(
      buildActionToastPayload("resend-invitation", "Ana B", echoT).variant
    ).toBe("success")
  })

  it("keys the title off the action and interpolates the name into the message", () => {
    const payload = buildActionToastPayload("suspend", "Ana B", echoT)
    expect(payload.title).toBe("actions.suspend.success.title")
    expect(payload.message).toBe("actions.suspend.success.message:Ana B")
  })

  it("returns a distinct title for each modal action", () => {
    const titles = (
      ["suspend", "reactivate", "deactivate", "resend-invitation"] as const
    ).map(action => buildActionToastPayload(action, "Ana B", echoT).title)
    expect(new Set(titles).size).toBe(titles.length)
  })
})

// ---------------------------------------------------------------------------
// buildIdentityPatch
// ---------------------------------------------------------------------------

describe("buildIdentityPatch", () => {
  const current = {
    first_name: "Ana",
    last_name: "Muller",
    phone_number: "+49 151 1",
  }

  it("reports no changes when every field matches", () => {
    const { hasChanges } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller", phone_number: "+49 151 1" },
      current
    )
    expect(hasChanges).toBe(false)
  })

  it("detects a first-name change", () => {
    const { patch, hasChanges } = buildIdentityPatch(
      { first_name: "Anna", last_name: "Muller", phone_number: "+49 151 1" },
      current
    )
    expect(hasChanges).toBe(true)
    expect(patch.first_name).toBe("Anna")
  })

  it("omits phone_number when the phone did not change", () => {
    const { patch } = buildIdentityPatch(
      { first_name: "Anna", last_name: "Muller", phone_number: "+49 151 1" },
      current
    )
    expect("phone_number" in patch).toBe(false)
  })

  it("sends null when the phone is cleared to an empty string", () => {
    const { patch, hasChanges } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller", phone_number: "" },
      current
    )
    expect(hasChanges).toBe(true)
    expect(patch.phone_number).toBeNull()
  })

  it("sends the new phone when it changed", () => {
    const { patch } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller", phone_number: "+49 151 2" },
      current
    )
    expect(patch.phone_number).toBe("+49 151 2")
  })

  it("treats an absent input phone and a null current phone as unchanged", () => {
    const { hasChanges, patch } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller" },
      { first_name: "Ana", last_name: "Muller", phone_number: null }
    )
    expect(hasChanges).toBe(false)
    expect("phone_number" in patch).toBe(false)
  })

  it("detects adding a phone where the current value is null", () => {
    const { hasChanges, patch } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller", phone_number: "+49 151 9" },
      { first_name: "Ana", last_name: "Muller", phone_number: null }
    )
    expect(hasChanges).toBe(true)
    expect(patch.phone_number).toBe("+49 151 9")
  })

  it("always carries both name fields, even when only the phone changed", () => {
    const { patch } = buildIdentityPatch(
      { first_name: "Ana", last_name: "Muller", phone_number: "+49 151 2" },
      current
    )
    expect(patch.first_name).toBe("Ana")
    expect(patch.last_name).toBe("Muller")
  })
})
