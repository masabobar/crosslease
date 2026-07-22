// Static options — no NPV formula registry endpoint exists yet for the FE to query.
// Flagged as a follow-up gap in the FE stories.
// Lives in its own file (not co-located in a step component) so it can be shared between
// BehavioralSettingsStep and ReviewStep without breaking Fast Refresh (component files
// may only export components).
export const NPV_FORMULA_OPTIONS = [
  {
    ref: "NPV-FORMULA-STD-v3",
    code: "NPV-FORMULA-STD",
    version: "v3",
    labelKey: "npvFormulas.standardAnnuity",
  },
  {
    ref: "NPV-FORMULA-BULLET-v2",
    code: "NPV-FORMULA-BULLET",
    version: "v2",
    labelKey: "npvFormulas.bullet",
  },
  {
    ref: "NPV-FORMULA-RV-v1",
    code: "NPV-FORMULA-RV",
    version: "v1",
    labelKey: "npvFormulas.residualValue",
  },
] as const

// Wire value for the platform module key, per `../refinext-api/src/app/core/platform/modules.py`.
export const BANK_PRODUCT_TEMPLATE_MODULE_KEY = "bank_product_template"

// Single source of truth for the deprecation justification's minimum length — shared by the
// Zod request schema (api/schema.ts) and the VersionHistoryPage UI gating logic, so the two
// never drift apart.
export const DEPRECATION_JUSTIFICATION_MIN_LENGTH = 10
