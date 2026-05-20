import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  resources: {
    en: {
      common: enCommon,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

const languageLoaders: Partial<Record<string, () => Promise<void>>> = {
  de: async () => {
    const [common] = await Promise.all([import('./locales/de/common.json')])
    i18n.addResourceBundle('de', 'common', common.default)
  },
}

export async function changeLanguage(lang: string): Promise<void> {
  const load = languageLoaders[lang]
  if (load && !i18n.hasResourceBundle(lang, 'common')) {
    await load()
  }
  await i18n.changeLanguage(lang)
}

export default i18n
