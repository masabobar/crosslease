import type enCommon from "./locales/en/common.json"
import type enAuth from "./locales/en/auth.json"
import type enUsers from "./locales/en/users.json"
import type enLc from "./locales/en/lc.json"
import type enPendingApprovals from "./locales/en/pendingApprovals.json"
import type enAudit from "./locales/en/audit.json"
import type enTenants from "./locales/en/tenants.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof enCommon
      auth: typeof enAuth
      users: typeof enUsers
      lc: typeof enLc
      pendingApprovals: typeof enPendingApprovals
      audit: typeof enAudit
      tenants: typeof enTenants
    }
  }
}
