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
