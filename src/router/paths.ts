export const PLATFORM_ADMINISTRATION_PREFIX = "/platform-administration"
export const BUSINESS_CONFIGURATION_PREFIX = "/business-configuration"

export const PATHS = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  RESET_PASSWORD_VERIFY: "/reset-password/verify",
  ACTIVATE_ACCOUNT: "/activate",
  VERIFY_EMAIL: "/verify-email",
  MFA_VERIFY: "/mfa/verify",
  MFA_ENROLL: "/mfa/enroll",
  DASHBOARD: "/",
  FORBIDDEN: "/403",
  USER_MANAGEMENT: "/platform-administration/user-management",
  USER_DETAIL: "/platform-administration/user-management/:id",
  LC_WORKSPACE: "/lc",
  LC_REQUESTS: "/lc/requests",
  LC_STATUS: "/lc/status",
  LC_DOCUMENTS: "/lc/documents",
  LC_PROPOSALS: "/lc/proposals",
  LC_FRAMEWORK_AGREEMENTS: "/lc/framework-agreements",
  // D-12 (PRD1042-1796 item 9) — a leasing company's own document obligations for one case. Per
  // case, so it carries an object id; no case module exists to link from yet, the same interim
  // position as the bank-side case screens.
  LC_CASE_DOCUMENTS: "/lc/cases/:businessObjectId/documents",
  PENDING_APPROVALS: "/platform-administration/pending-approvals",
  TENANT_MANAGEMENT: "/platform-administration/tenant-management",
  TENANT_MANAGEMENT_CREATE: "/platform-administration/tenant-management/create",
  TENANT_DETAIL: "/platform-administration/tenant-management/:id",
  SETTINGS_PROFILE: "/settings/profile",
  AUDIT_TRAIL: "/platform-administration/audit-trail",
  AUDIT_TRAIL_DETAIL: "/platform-administration/audit-trail/:eventId",
  NOTIFICATION_CONFIGURATION:
    "/platform-administration/notification-configuration",
  PARTNER_REGISTRY: "/partners",
  PARTNER_SUBMIT: "/partners/new",
  PARTNER_DETAIL: "/partners/:id",
  PARTNER_DUPLICATES: "/partners/duplicates",
  PARTNER_DUPLICATE_DETAIL: "/partners/duplicates/:pairId",
  PRODUCT_TEMPLATE_LIST: "/business-configuration/product-templates",
  PRODUCT_TEMPLATE_CREATE: "/business-configuration/product-templates/new",
  PRODUCT_TEMPLATE_VERSION_HISTORY:
    "/business-configuration/product-templates/:templateId/version-history",
  // Version-scoped, mirroring PRODUCT_TEMPLATE_NEW_VERSION below: the underlying endpoint is
  // per-version, and CR-BPT-04 makes non-current versions first-class, so a version-agnostic URL
  // would have to invent a rule for which version it shows.
  PRODUCT_TEMPLATE_DETAIL:
    "/business-configuration/product-templates/:templateId/versions/:versionNumber",
  PRODUCT_TEMPLATE_NEW_VERSION:
    "/business-configuration/product-templates/:templateId/versions/:versionNumber/edit",
  FRAMEWORK_AGREEMENT_LIST: "/business-configuration/framework-agreements",
  FRAMEWORK_AGREEMENT_CREATE:
    "/business-configuration/framework-agreements/new",
  FRAMEWORK_AGREEMENT_DETAIL:
    "/business-configuration/framework-agreements/:id",
  FRAMEWORK_AGREEMENT_EDIT:
    "/business-configuration/framework-agreements/:id/edit",
  WORKFLOW_TASK_CATALOG_LIST: "/business-configuration/workflow-task-catalogs",
  WORKFLOW_TASK_CATALOG_DETAIL:
    "/business-configuration/workflow-task-catalogs/:id",
  // One catalogue per bank (CR-DRC A2): a single page, resolved from the tenant — no list and no
  // detail-by-id route. The path name keeps its historical *_LIST suffix for continuity.
  DOCUMENT_REQUIREMENT_CATALOG_LIST:
    "/business-configuration/document-requirement-catalogs",
  // PRD1042-1794 Block 10 — the tenant's document-type registry management screen. A Bank Power
  // User populates this so the requirement-authoring dropdown has types to pick from.
  DOCUMENT_TYPE_LIST: "/business-configuration/document-types",
  // Case work, not business configuration — hence the separate prefix. No case module exists yet
  // to link here, so this is the interim entry point for the runtime checklist; see the design
  // provenance note on CaseChecklistPage.tsx.
  CASE_CHECKLIST: "/cases/:businessObjectId/checklist",
  // D-11 (PRD1042-1796 item 5). A deep link that still works; the primary way in is now the Case
  // list → Case detail → Documents tab below. Carries only the object id — the catalogue is
  // resolved (one per bank) and the checkpoint is not a property of the object.
  CASE_DOCUMENT_REQUIREMENTS: "/cases/:businessObjectId/documents",
  // PRD1042-1794 (DRC usability) — the operational Case list and detail. The detail's Documents tab
  // is how Front/Back Office reach a case's documents; before this there was no way to a case's
  // document surface except typing the CASE_DOCUMENT_REQUIREMENTS URL by hand.
  CASE_LIST: "/cases",
  CASE_DETAIL: "/cases/:caseId",
} as const

export function adminUserDetail(id: string): string {
  return PATHS.USER_DETAIL.replace(":id", id)
}

export function tenantDetail(id: string): string {
  return PATHS.TENANT_DETAIL.replace(":id", id)
}

export function auditTrailDetail(eventId: string): string {
  return PATHS.AUDIT_TRAIL_DETAIL.replace(":eventId", eventId)
}

export function partnerDetail(id: string): string {
  return PATHS.PARTNER_DETAIL.replace(":id", id)
}

export function partnerDuplicateDetail(pairId: string): string {
  return PATHS.PARTNER_DUPLICATE_DETAIL.replace(":pairId", pairId)
}

export function productTemplateVersionHistory(templateId: string): string {
  return PATHS.PRODUCT_TEMPLATE_VERSION_HISTORY.replace(
    ":templateId",
    templateId
  )
}

export function productTemplateNewVersionEdit(
  templateId: string,
  versionNumber: string
): string {
  return PATHS.PRODUCT_TEMPLATE_NEW_VERSION.replace(
    ":templateId",
    templateId
  ).replace(":versionNumber", versionNumber)
}

export function productTemplateDetail(
  templateId: string,
  versionNumber: string
): string {
  return PATHS.PRODUCT_TEMPLATE_DETAIL.replace(
    ":templateId",
    templateId
  ).replace(":versionNumber", versionNumber)
}

export function frameworkAgreementDetail(id: string): string {
  return PATHS.FRAMEWORK_AGREEMENT_DETAIL.replace(":id", id)
}

export function frameworkAgreementEdit(id: string): string {
  return PATHS.FRAMEWORK_AGREEMENT_EDIT.replace(":id", id)
}

export function workflowTaskCatalogDetail(id: string): string {
  return PATHS.WORKFLOW_TASK_CATALOG_DETAIL.replace(":id", id)
}

export function caseChecklist(businessObjectId: string): string {
  return PATHS.CASE_CHECKLIST.replace(":businessObjectId", businessObjectId)
}

export function caseDetail(caseId: string): string {
  return PATHS.CASE_DETAIL.replace(":caseId", caseId)
}

export function lcCaseDocuments(businessObjectId: string): string {
  return PATHS.LC_CASE_DOCUMENTS.replace(":businessObjectId", businessObjectId)
}
