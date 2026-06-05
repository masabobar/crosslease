import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enCommon from "./locales/en/common.json"
import enAuth from "./locales/en/auth.json"
import enUsers from "./locales/en/users.json"
import enLc from "./locales/en/lc.json"
import enPendingApprovals from "./locales/en/pendingApprovals.json"

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
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

const languageLoaders: Partial<Record<string, () => Promise<void>>> = {
  de: async () => {
    const [common, auth, users, lc, pendingApprovals] = await Promise.all([
      import("./locales/de/common.json"),
      import("./locales/de/auth.json"),
      import("./locales/de/users.json"),
      import("./locales/de/lc.json"),
      import("./locales/de/pendingApprovals.json"),
    ])
    i18n.addResourceBundle("de", "common", common.default)
    i18n.addResourceBundle("de", "auth", auth.default)
    i18n.addResourceBundle("de", "users", users.default)
    i18n.addResourceBundle("de", "lc", lc.default)
    i18n.addResourceBundle("de", "pendingApprovals", pendingApprovals.default)
  },
}

export async function changeLanguage(lang: string): Promise<void> {
  const load = languageLoaders[lang]
  if (load && !i18n.hasResourceBundle(lang, "common")) {
    await load()
  }
  await i18n.changeLanguage(lang)
}

export default i18n
