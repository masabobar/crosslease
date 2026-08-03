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
  // Case work, not business configuration — hence the separate prefix. No case module exists yet
  // to link here, so this is the interim entry point for the runtime checklist; see the design
  // provenance note on CaseChecklistPage.tsx.
  CASE_CHECKLIST: "/cases/:businessObjectId/checklist",
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
