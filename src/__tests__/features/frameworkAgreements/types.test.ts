import { describe, it, expect } from "vitest"
import {
  FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES,
  FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES,
  FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES,
  FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES,
} from "@/features/frameworkAgreements/types"

/**
 * Framework Agreement role gates.
 *
 * The BE subtracts every framework_agreement:* permission from system_admin
 * (CR PRD1042-1550 / B5) — the CrossLease platform operator has no FA access at
 * all, not even read. support_user is likewise ungranted for FA_LIST / FA_READ.
 * These lists drive the sidebar link, the route guards, and the detail-page
 * action buttons, so a role leaking back in silently re-opens the screen to a
 * user the API will only ever 403.
 */

const NO_FA_ACCESS_ROLES = ["system_admin", "support_user"] as const

describe("FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES", () => {
  it("contains only bank_power_user", () => {
    expect(FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES).toEqual([
      "bank_power_user",
    ])
  })

  it.each(NO_FA_ACCESS_ROLES)("excludes %s", role => {
    expect(FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES.includes(role)).toBe(false)
  })

  it("excludes leasing_company_user (LC portal is a separate screen)", () => {
    expect(
      FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES.includes("leasing_company_user")
    ).toBe(false)
  })
})

describe("FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES", () => {
  it("contains the four roles the BE grants FA_LIST + FA_READ", () => {
    expect([...FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES].sort()).toEqual([
      "auditor",
      "back_office",
      "bank_power_user",
      "front_office",
    ])
  })

  it.each(NO_FA_ACCESS_ROLES)("excludes %s", role => {
    expect(FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES.includes(role)).toBe(false)
  })
})

describe("FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES", () => {
  it("contains the three roles that see populated audit history", () => {
    expect([...FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES].sort()).toEqual([
      "auditor",
      "back_office",
      "bank_power_user",
    ])
  })

  it.each(NO_FA_ACCESS_ROLES)("excludes %s", role => {
    expect(FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES.includes(role)).toBe(
      false
    )
  })

  it("excludes front_office (no FA_AUDIT_READ permission)", () => {
    expect(
      FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES.includes("front_office")
    ).toBe(false)
  })

  it("is a subset of the FA read gate", () => {
    FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES.forEach(role => {
      expect(FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES).toContain(role)
    })
  })
})

describe("FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES", () => {
  it("contains only front_office", () => {
    expect([...FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES]).toEqual([
      "front_office",
    ])
  })

  // The narrowed view is a subset of the detail screen, so a role that cannot
  // open the screen at all must never appear here — it would read as "sees the
  // pricing section" when it in fact sees a 403.
  it("is a subset of the FA read gate", () => {
    FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES.forEach(role => {
      expect(FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES).toContain(role)
    })
  })

  it.each(NO_FA_ACCESS_ROLES)("excludes %s", role => {
    expect(FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES.includes(role)).toBe(false)
  })

  // bank_power_user edits the agreement and back_office/auditor read all of it;
  // narrowing any of them to the pricing section would hide data they own.
  it.each(["bank_power_user", "back_office", "auditor"] as const)(
    "excludes %s, which sees the full detail surface",
    role => {
      expect(FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES.includes(role)).toBe(false)
    }
  )

  // front_office holds FA read but not FA audit — the two gates must stay
  // consistent, or the pricing-only view would still offer an audit tab.
  it("names a role that is excluded from the audit gate", () => {
    FRAMEWORK_AGREEMENT_PRICING_ONLY_ROLES.forEach(role => {
      expect(FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES).not.toContain(role)
    })
  })
})
