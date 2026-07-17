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
  PARTNER_REGISTRY: "/partners",
  PARTNER_SUBMIT: "/partners/new",
  PARTNER_DETAIL: "/partners/:id",
  PARTNER_DUPLICATES: "/partners/duplicates",
  PARTNER_DUPLICATE_DETAIL: "/partners/duplicates/:pairId",
  PRODUCT_TEMPLATE_LIST: "/business-configuration/product-templates",
  PRODUCT_TEMPLATE_CREATE: "/business-configuration/product-templates/new",
  PRODUCT_TEMPLATE_VERSION_HISTORY:
    "/business-configuration/product-templates/:templateId/version-history",
  PRODUCT_TEMPLATE_NEW_VERSION:
    "/business-configuration/product-templates/:templateId/versions/:versionNumber/edit",
  FRAMEWORK_AGREEMENT_LIST: "/business-configuration/framework-agreements",
  FRAMEWORK_AGREEMENT_CREATE:
    "/business-configuration/framework-agreements/new",
  FRAMEWORK_AGREEMENT_DETAIL:
    "/business-configuration/framework-agreements/:id",
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

export function frameworkAgreementDetail(id: string): string {
  return PATHS.FRAMEWORK_AGREEMENT_DETAIL.replace(":id", id)
}
