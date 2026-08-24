import { describe, it, expect } from "vitest"
import { createInstance } from "i18next"
import BE_ERROR_CODES from "@/__tests__/fixtures/beErrorCodes.json"

import enCommon from "@/i18n/locales/en/common.json"
import enAuth from "@/i18n/locales/en/auth.json"
import enUsers from "@/i18n/locales/en/users.json"
import enLc from "@/i18n/locales/en/lc.json"
import enPendingApprovals from "@/i18n/locales/en/pendingApprovals.json"
import enAudit from "@/i18n/locales/en/audit.json"
import enTenants from "@/i18n/locales/en/tenants.json"
import enPartners from "@/i18n/locales/en/partners.json"
import enProductTemplates from "@/i18n/locales/en/productTemplates.json"
import enFrameworkAgreements from "@/i18n/locales/en/frameworkAgreements.json"
import enNotifications from "@/i18n/locales/en/notifications.json"
import enWorkflowTaskCatalog from "@/i18n/locales/en/workflowTaskCatalog.json"
import enDocumentRequirements from "@/i18n/locales/en/documentRequirements.json"

import deCommon from "@/i18n/locales/de/common.json"
import deAuth from "@/i18n/locales/de/auth.json"
import deUsers from "@/i18n/locales/de/users.json"
import deLc from "@/i18n/locales/de/lc.json"
import dePendingApprovals from "@/i18n/locales/de/pendingApprovals.json"
import deAudit from "@/i18n/locales/de/audit.json"
import deTenants from "@/i18n/locales/de/tenants.json"
import dePartners from "@/i18n/locales/de/partners.json"
import deProductTemplates from "@/i18n/locales/de/productTemplates.json"
import deFrameworkAgreements from "@/i18n/locales/de/frameworkAgreements.json"
import deNotifications from "@/i18n/locales/de/notifications.json"
import deWorkflowTaskCatalog from "@/i18n/locales/de/workflowTaskCatalog.json"
import deDocumentRequirements from "@/i18n/locales/de/documentRequirements.json"

/**
 * Guards the backend↔frontend error contract.
 *
 * The bug these tests exist for: a BE error code with no `errors.<CODE>` key resolves to
 * `errors.generic`, so the user gets "Something went wrong" instead of the actual reason. That
 * is invisible to every other gate — type-check, lint, and `check-project-invariants.js` (which
 * compares en against de, so a key missing from *both* locales passes it).
 *
 * `src/__tests__/fixtures/beErrorCodes.json` is the BE's error taxonomy: every value of
 * `ErrorCode` in `../refinext-api/src/app/shared/errors/codes.py`, plus the codes the BE emits
 * as raw dicts outside that enum (`MODULE_NOT_ACTIVE` and `PERMISSION_DENIED` in
 * `shared/permissions/dependencies.py`, the `EXPORT_*` / `AUDIT_EVENT_NOT_FOUND` router codes).
 * Refresh it when the BE adds codes — a new code with no key is exactly what this catches.
 */

const RESOURCES = {
  en: {
    common: enCommon,
    auth: enAuth,
    users: enUsers,
    lc: enLc,
    pendingApprovals: enPendingApprovals,
    audit: enAudit,
    tenants: enTenants,
    partners: enPartners,
    productTemplates: enProductTemplates,
    frameworkAgreements: enFrameworkAgreements,
    notifications: enNotifications,
    workflowTaskCatalog: enWorkflowTaskCatalog,
    documentRequirements: enDocumentRequirements,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    users: deUsers,
    lc: deLc,
    pendingApprovals: dePendingApprovals,
    audit: deAudit,
    tenants: deTenants,
    partners: dePartners,
    productTemplates: deProductTemplates,
    frameworkAgreements: deFrameworkAgreements,
    notifications: deNotifications,
    workflowTaskCatalog: deWorkflowTaskCatalog,
    documentRequirements: deDocumentRequirements,
  },
} as const

type AppNamespace = keyof typeof RESOURCES.en
const NAMESPACES = Object.keys(RESOURCES.en) as AppNamespace[]
const LOCALES = ["en", "de"] as const

// Keys are assembled from wire values at runtime, so they cannot be proven against the typed
// resource tree — `t` is used through its plain call signature, as the app's helper does.
type LooseT = (key: string, options?: Record<string, unknown>) => string

// Mirrors src/i18n/config.ts: same defaultNS and the fallbackNS the shared catalogue depends on.
function makeT(lng: (typeof LOCALES)[number], ns: AppNamespace): LooseT {
  const i18n = createInstance()
  void i18n.init({
    lng,
    fallbackLng: false,
    defaultNS: "common",
    fallbackNS: "common",
    resources: RESOURCES,
  })
  return i18n.getFixedT(lng, ns) as unknown as LooseT
}

/** How the app decides a code has no copy: the lookup falls through to `errors.generic`. */
function resolves(t: LooseT, code: string): boolean {
  const generic = t("errors.generic")
  const value = t(`errors.${code}`, { defaultValue: generic })
  return (
    value !== generic && value !== `errors.${code}` && value.trim().length > 0
  )
}

describe.each(LOCALES)("BE error catalogue — %s", lng => {
  it("resolves every BE error code from at least one namespace", () => {
    const unresolved = BE_ERROR_CODES.filter(
      code => !NAMESPACES.some(ns => resolves(makeT(lng, ns), code))
    )
    expect(unresolved).toEqual([])
  })

  it("resolves the shared codes from every feature namespace", () => {
    // These come from cross-cutting dependencies (RBAC, rate limiting, the request validator),
    // so any screen can raise them. Keyed once in `common`; reachable everywhere via fallbackNS.
    const shared = [
      "PERMISSION_DENIED",
      "FORBIDDEN",
      "UNAUTHORIZED",
      "MODULE_NOT_ACTIVE",
      "NOT_FOUND",
      "BAD_REQUEST",
      "INTERNAL_SERVER_ERROR",
      "RATE_LIMIT_EXCEEDED",
      "SESSION_EXPIRED",
      "VALIDATION_ERROR",
      "NETWORK_ERROR",
    ]
    const gaps = NAMESPACES.flatMap(ns => {
      const t = makeT(lng, ns)
      return shared
        .filter(code => !resolves(t, code))
        .map(code => `${ns}:${code}`)
    })
    expect(gaps).toEqual([])
  })

  it("has no blank or placeholder message for any error-code key", () => {
    const blanks: string[] = []
    for (const ns of NAMESPACES) {
      const bucket = (
        RESOURCES[lng][ns] as { errors?: Record<string, unknown> }
      ).errors
      if (!bucket) continue
      for (const [code, value] of Object.entries(bucket)) {
        if (!/^[A-Z][A-Z0-9_]+$/.test(code)) continue
        if (typeof value !== "string" || value.trim().length === 0) {
          blanks.push(`${ns}:${code}`)
        }
      }
    }
    expect(blanks).toEqual([])
  })
})

describe("fallbackNS wiring", () => {
  // Direct regression guard for the `fallbackNS: "common"` line in src/i18n/config.ts. Without
  // it, a caller-supplied defaultValue short-circuits the shared catalogue and every feature
  // screen falls back to "Something went wrong" for the codes above.
  it("reaches a common-only code from a feature namespace", () => {
    const t = makeT("en", "partners")
    const partnersOwn = (enPartners as { errors: Record<string, string> })
      .errors
    expect(partnersOwn.PERMISSION_DENIED).toBeUndefined()
    expect(resolves(t, "PERMISSION_DENIED")).toBe(true)
    expect(t("errors.PERMISSION_DENIED", { defaultValue: "x" })).toBe(
      (enCommon as { errors: Record<string, string> }).errors.PERMISSION_DENIED
    )
  })

  it("lets a feature namespace override a shared code", () => {
    // partners keeps its own NOT_FOUND ("Partner not found.") — more specific than common's.
    const t = makeT("en", "partners")
    expect(t("errors.NOT_FOUND", { defaultValue: "x" })).toBe(
      (enPartners as { errors: Record<string, string> }).errors.NOT_FOUND
    )
  })
})
