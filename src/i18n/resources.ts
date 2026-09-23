import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enLayout from './locales/en/layout.json'
import esAuth from './locales/es/auth.json'
import esCommon from './locales/es/common.json'
import esLayout from './locales/es/layout.json'

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'es'
export const DEFAULT_NAMESPACE = 'common'

export const resources = {
  es: { common: esCommon, auth: esAuth, layout: esLayout },
  en: { common: enCommon, auth: enAuth, layout: enLayout },
} as const
