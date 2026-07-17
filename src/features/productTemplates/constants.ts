// Static options — no NPV formula registry, Workflow Task Catalog (E15), Document
// Requirement Catalog (E16), or Validation & Gating Engine (E18) endpoint exists yet for
// the FE to query (mirrors the orchestration catalogs' StubCatalogAdapter, which always
// returns ACTIVE on the BE side). Flagged as a follow-up gap in the FE stories.
// Lives in its own file (not co-located in a step component) so it can be shared between
// BehavioralSettingsStep/OrchestrationStep and ReviewStep without breaking Fast Refresh
// (component files may only export components).
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

export const WORKFLOW_TASK_OPTIONS = [
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e01",
    code: "WT-CREDIT-CHECK",
    version: "v4",
    labelKey: "workflowTasks.creditAssessment",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e02",
    code: "WT-COLLATERAL-VAL",
    version: "v2",
    labelKey: "workflowTasks.collateralValuation",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e03",
    code: "WT-AML-SCREEN",
    version: "v3",
    labelKey: "workflowTasks.amlScreening",
  },
  {
    id: "b3d1a2e4-8f6a-4c11-9d2b-1a2b3c4d5e04",
    code: "WT-DISBURSEMENT-APPR",
    version: "v1",
    labelKey: "workflowTasks.disbursementApproval",
  },
] as const

export const DOCUMENT_OPTIONS = [
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f01",
    code: "DOC-ASSET-INVOICE",
    version: "v2",
    labelKey: "documentRequirements.assetInvoice",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f02",
    code: "DOC-LEASE-AGREEMENT",
    version: "v2",
    labelKey: "documentRequirements.leaseAgreement",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f03",
    code: "DOC-FINANCIALS",
    version: "v1",
    labelKey: "documentRequirements.financialStatements",
  },
  {
    id: "c4e2b3f5-9a7b-4d22-8e3c-2b3c4d5e6f04",
    code: "DOC-INSURANCE",
    version: "v2",
    labelKey: "documentRequirements.insuranceCertificate",
  },
] as const

// Wire value for the platform module key, per `../refinext-api/src/app/core/platform/modules.py`.
export const BANK_PRODUCT_TEMPLATE_MODULE_KEY = "bank_product_template"

// Single source of truth for the deprecation justification's minimum length — shared by the
// Zod request schema (api/schema.ts) and the VersionHistoryPage UI gating logic, so the two
// never drift apart.
export const DEPRECATION_JUSTIFICATION_MIN_LENGTH = 10

export const VALIDATION_RULE_SET_OPTIONS = [
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a01",
    code: "VRS-STANDARD",
    version: "v5",
    labelKey: "validationRuleSets.standardGating",
  },
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a02",
    code: "VRS-REAL-ESTATE",
    version: "v3",
    labelKey: "validationRuleSets.realEstateGating",
  },
  {
    id: "d5f3c4a6-ab8c-4e33-9f4d-3c4d5e6f7a03",
    code: "VRS-PORTFOLIO",
    version: "v3",
    labelKey: "validationRuleSets.portfolioGating",
  },
] as const
