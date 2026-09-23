import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import esAuth from './locales/es/auth.json'
import esCommon from './locales/es/common.json'

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'es'
export const DEFAULT_NAMESPACE = 'common'

export const resources = {
  es: { common: esCommon, auth: esAuth },
  en: { common: enCommon, auth: enAuth },
} as const
