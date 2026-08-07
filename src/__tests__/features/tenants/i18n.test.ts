import { describe, it, expect } from "vitest"
import { createInstance } from "i18next"
import enTenants from "@/i18n/locales/en/tenants.json"
import deTenants from "@/i18n/locales/de/tenants.json"
import {
  GovernanceEventTypeSchema,
  TenantStatusSchema,
  TenantModuleStatusSchema,
  AccessReasonSchema,
  TenantTypeSchema,
} from "@/features/tenants/api/schema"

// scripts/check-project-invariants.js compares en against de, so a key absent from
// BOTH locales passes it and still ships as a visible raw key path — the failure class
// browser-verification.md §2 calls out. These tests close that gap for the tenants
// namespace by resolving every wire value through a real i18next instance, with the
// same options the app uses (no keySeparator override, so "." nests).
//
// This matters most for the governance event types: their wire values contain dots, so
// they resolve against nested objects rather than flat keys. Nothing else asserts that.
// The app's `t` is typed against the resource tree, which is the point here: these
// keys are built from wire values at runtime, so they can only be looked up as plain
// strings. The cast reflects what i18next actually accepts, not a shortcut.
type LooseT = (key: string, options?: Record<string, unknown>) => string

function makeT(lng: "en" | "de"): LooseT {
  const i18n = createInstance()
  void i18n.init({
    lng,
    fallbackLng: false,
    resources: { en: { tenants: enTenants }, de: { tenants: deTenants } },
  })
  return i18n.getFixedT(lng, "tenants") as unknown as LooseT
}

const LOCALES = ["en", "de"] as const

describe.each(LOCALES)("tenants namespace — %s", lng => {
  const t = makeT(lng)

  // A miss returns the key path itself, which is exactly what the user would see.
  const resolves = (key: string) => t(key) !== key && t(key).trim().length > 0

  it("resolves every governance event type", () => {
    const missing = GovernanceEventTypeSchema.options.filter(
      type => !resolves(`detail.governance.eventTypes.${type}`)
    )
    expect(missing).toEqual([])
  })

  it("resolves every state label the history badges can emit", () => {
    // The tokens extractStatusValue() can produce: the boolean pair plus every
    // status enum that reaches old_data/new_data.
    const tokens = [
      "enabled",
      "disabled",
      ...TenantStatusSchema.options,
      ...TenantModuleStatusSchema.options,
    ]
    const missing = tokens.filter(
      token => !resolves(`detail.governance.stateLabels.${token}`)
    )
    // pending_* module statuses have no state-label key and legitimately fall back
    // to the humanised form, so only assert the ones the badge map actually styles.
    expect(missing.filter(token => !token.startsWith("pending_"))).toEqual([])
  })

  it("resolves every grant form error code the schema can raise", () => {
    const codes = [
      "required",
      "validFromInPast",
      "validUntilBeforeValidFrom",
      "grantDurationExceeded",
    ]
    const missing = codes.filter(
      code => !resolves(`detail.grants.newGrantDialog.errors.${code}`)
    )
    expect(missing).toEqual([])
  })

  it("interpolates the grant duration limit rather than leaving the placeholder", () => {
    const message = t(
      "detail.grants.newGrantDialog.errors.grantDurationExceeded",
      {
        days: 30,
      }
    )
    expect(message).toContain("30")
    expect(message).not.toContain("{{days}}")
  })

  it("resolves every tenant status, module status, type and access reason", () => {
    const missing = [
      ...TenantStatusSchema.options.map(s => `statuses.${s}`),
      ...TenantModuleStatusSchema.options.map(
        s => `detail.modules.status.${s}`
      ),
      ...TenantTypeSchema.options.map(ty => `tenantTypes.${ty}`),
      ...AccessReasonSchema.options.map(
        r => `detail.grants.accessReasons.${r}`
      ),
    ].filter(key => !resolves(key))
    expect(missing).toEqual([])
  })

  it("resolves the licence-limit field error codes", () => {
    expect(resolves("detail.licenceLimits.editDialog.errors.required")).toBe(
      true
    )
    expect(resolves("detail.licenceLimits.editDialog.errors.minValue")).toBe(
      true
    )
  })
})
