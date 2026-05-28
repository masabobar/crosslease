export const PATHS = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  ACTIVATE_ACCOUNT: "/activate",
  DASHBOARD: "/",
  FORBIDDEN: "/403",
  USER_MANAGEMENT: "/platform-administration/user-management",
  USER_DETAIL: "/platform-administration/user-management/:id",
  LC_WORKSPACE: "/lc",
  LC_REQUESTS: "/lc/requests",
  LC_STATUS: "/lc/status",
  LC_DOCUMENTS: "/lc/documents",
  LC_PROPOSALS: "/lc/proposals",
} as const

export function adminUserDetail(id: string): string {
  return PATHS.USER_DETAIL.replace(":id", id)
}
