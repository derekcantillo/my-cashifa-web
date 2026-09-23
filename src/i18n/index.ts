import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { DEFAULT_LANGUAGE, DEFAULT_NAMESPACE, SUPPORTED_LANGUAGES, resources } from './resources'

export const LANGUAGE_STORAGE_KEY = 'cashifa-language'

i18n.on('languageChanged', language => {
  document.documentElement.lang = language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: DEFAULT_NAMESPACE,
    ns: Object.keys(resources[DEFAULT_LANGUAGE]),
    // Resources are bundled, so initialize synchronously and render translated on first paint.
    initAsync: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type Language } from './resources'
export default i18n
