import enAuth from './locales/en/auth.json'
import enCategories from './locales/en/categories.json'
import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enGoals from './locales/en/goals.json'
import enLayout from './locales/en/layout.json'
import enLoans from './locales/en/loans.json'
import enReports from './locales/en/reports.json'
import enTransactions from './locales/en/transactions.json'
import esAuth from './locales/es/auth.json'
import esCategories from './locales/es/categories.json'
import esCommon from './locales/es/common.json'
import esDashboard from './locales/es/dashboard.json'
import esGoals from './locales/es/goals.json'
import esLayout from './locales/es/layout.json'
import esLoans from './locales/es/loans.json'
import esReports from './locales/es/reports.json'
import esTransactions from './locales/es/transactions.json'

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'es'
export const DEFAULT_NAMESPACE = 'common'

export const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    layout: esLayout,
    categories: esCategories,
    dashboard: esDashboard,
    transactions: esTransactions,
    goals: esGoals,
    reports: esReports,
    loans: esLoans,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    layout: enLayout,
    categories: enCategories,
    dashboard: enDashboard,
    transactions: enTransactions,
    goals: enGoals,
    reports: enReports,
    loans: enLoans,
  },
} as const
