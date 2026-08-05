import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enCommon from "./locales/en/common.json"
import enAuth from "./locales/en/auth.json"
import enUsers from "./locales/en/users.json"
import enLc from "./locales/en/lc.json"
import enPendingApprovals from "./locales/en/pendingApprovals.json"
import enAudit from "./locales/en/audit.json"
import enTenants from "./locales/en/tenants.json"
import enPartners from "./locales/en/partners.json"
import enProductTemplates from "./locales/en/productTemplates.json"
import enFrameworkAgreements from "./locales/en/frameworkAgreements.json"
import enNotifications from "./locales/en/notifications.json"
import enWorkflowTaskCatalog from "./locales/en/workflowTaskCatalog.json"
import enDocumentRequirements from "./locales/en/documentRequirements.json"

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      users: enUsers,
      lc: enLc,
      pendingApprovals: enPendingApprovals,
      audit: enAudit,
      tenants: enTenants,
      partners: enPartners,
      productTemplates: enProductTemplates,
      frameworkAgreements: enFrameworkAgreements,
      notifications: enNotifications,
      workflowTaskCatalog: enWorkflowTaskCatalog,
      documentRequirements: enDocumentRequirements,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

const languageLoaders: Partial<Record<string, () => Promise<void>>> = {
  de: async () => {
    const [
      common,
      auth,
      users,
      lc,
      pendingApprovals,
      audit,
      tenants,
      partners,
      productTemplates,
      frameworkAgreements,
      notifications,
      workflowTaskCatalog,
      documentRequirements,
    ] = await Promise.all([
      import("./locales/de/common.json"),
      import("./locales/de/auth.json"),
      import("./locales/de/users.json"),
      import("./locales/de/lc.json"),
      import("./locales/de/pendingApprovals.json"),
      import("./locales/de/audit.json"),
      import("./locales/de/tenants.json"),
      import("./locales/de/partners.json"),
      import("./locales/de/productTemplates.json"),
      import("./locales/de/frameworkAgreements.json"),
      import("./locales/de/notifications.json"),
      import("./locales/de/workflowTaskCatalog.json"),
      import("./locales/de/documentRequirements.json"),
    ])
    i18n.addResourceBundle("de", "common", common.default)
    i18n.addResourceBundle("de", "auth", auth.default)
    i18n.addResourceBundle("de", "users", users.default)
    i18n.addResourceBundle("de", "lc", lc.default)
    i18n.addResourceBundle("de", "pendingApprovals", pendingApprovals.default)
    i18n.addResourceBundle("de", "audit", audit.default)
    i18n.addResourceBundle("de", "tenants", tenants.default)
    i18n.addResourceBundle("de", "partners", partners.default)
    i18n.addResourceBundle("de", "productTemplates", productTemplates.default)
    i18n.addResourceBundle(
      "de",
      "frameworkAgreements",
      frameworkAgreements.default
    )
    i18n.addResourceBundle("de", "notifications", notifications.default)
    i18n.addResourceBundle(
      "de",
      "workflowTaskCatalog",
      workflowTaskCatalog.default
    )
    i18n.addResourceBundle(
      "de",
      "documentRequirements",
      documentRequirements.default
    )
  },
}

export async function changeLanguage(lang: string): Promise<void> {
  const load = languageLoaders[lang]
  if (load && !i18n.hasResourceBundle(lang, "common")) {
    await load()
  }
  await i18n.changeLanguage(lang)
}

export { i18n }
