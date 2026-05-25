import type enCommon from "./locales/en/common.json"
import type enAuth from "./locales/en/auth.json"
import type enUsers from "./locales/en/users.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof enCommon
      auth: typeof enAuth
      users: typeof enUsers
    }
  }
}
