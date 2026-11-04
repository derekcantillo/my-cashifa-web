import { describe, expect, it } from 'vitest'

import { typeChoices } from './categoriesByType'

describe('typeChoices', () => {
  it('a new movement can switch to a transfer', () => {
    expect(typeChoices({ isNew: true, fromRecurring: false })).toEqual([
      'EXPENSE',
      'INCOME',
      'TRANSFER',
    ])
  })

  it('an existing movement or one from a recurring expense cannot', () => {
    expect(typeChoices({ isNew: false, fromRecurring: false })).toEqual(['EXPENSE', 'INCOME'])
    expect(typeChoices({ isNew: true, fromRecurring: true })).toEqual(['EXPENSE', 'INCOME'])
  })
})
