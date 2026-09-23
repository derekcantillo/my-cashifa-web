import 'i18next'

import type { DEFAULT_NAMESPACE, resources } from './resources'

// Makes `t()` keys type-checked against the Spanish (source) locale files.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE
    resources: (typeof resources)['es']
  }
}
