import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enCommon from "./locales/en/common.json"
import enAuth from "./locales/en/auth.json"
import enUsers from "./locales/en/users.json"

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      users: enUsers,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

const languageLoaders: Partial<Record<string, () => Promise<void>>> = {
  de: async () => {
    const [common, auth, users] = await Promise.all([
      import("./locales/de/common.json"),
      import("./locales/de/auth.json"),
      import("./locales/de/users.json"),
    ])
    i18n.addResourceBundle("de", "common", common.default)
    i18n.addResourceBundle("de", "auth", auth.default)
    i18n.addResourceBundle("de", "users", users.default)
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
