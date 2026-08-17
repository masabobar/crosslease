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

// Single source of truth for the termination justification's length bounds — shared by the
// Zod request schema (api/schema.ts) and the ProductTemplatePublishedActions UI gating logic,
// so the two never drift apart. The max is enforced in the textarea as well as the schema:
// without it an over-long justification is only rejected after a round-trip to the backend.
export const TERMINATION_JUSTIFICATION_MIN_LENGTH = 10
export const TERMINATION_JUSTIFICATION_MAX_LENGTH = 2000

// Same treatment for the product-level deactivation reason — shared by the Zod request
// schema (api/schema.ts) and the ProductTemplatePublishedActions UI gating logic. Bounds
// happen to match the termination justification's, but this is a distinct wire field
// (DeactivateProductRequest.reason) on a distinct endpoint, so it gets its own constants
// rather than reusing the termination ones.
export const DEACTIVATION_REASON_MIN_LENGTH = 10
export const DEACTIVATION_REASON_MAX_LENGTH = 2000

// `product_status` is a plain string on the wire (no enum — see TemplateListItemSchema and
// ProductStatusResponseSchema in api/schema.ts), and "active" is its documented default. Every
// other value is a deactivated state (currently only ever "deactivated", set via
// deactivateProductTemplate) — treated as "not active" rather than matched against a second
// literal, so a new deactivated-ish value the BE adds still renders correctly.
export const PRODUCT_STATUS_ACTIVE = "active"

// Wire value of the audit log's `entity_type` for a product template, per
// `../refinext-api/` — used to build the audit-trail drill-down query. The audit feature
// itself has no FE constant for these: it renders whatever `entity_types` the filter-options
// endpoint returns, so the one place that hardcodes a specific type needs its own constant.
export const PRODUCT_TEMPLATE_AUDIT_ENTITY_TYPE = "product_template"
