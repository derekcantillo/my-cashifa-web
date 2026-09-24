import { parseAmount } from '@/lib/parseAmount'
import type { Settings } from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

interface RawSettings {
  targetSavingsPercentage: RawAmount
}

function toSettings(raw: RawSettings): Settings {
  return { targetSavingsPercentage: parseAmount(raw.targetSavingsPercentage) }
}

export interface SettingsRepository {
  get(): Promise<Settings>
  update(input: Settings): Promise<Settings>
}

const httpSettingsRepository: SettingsRepository = {
  async get() {
    const { data } = await apiClient.get<RawSettings>('/settings')
    return toSettings(data)
  },
  async update(input) {
    const { data } = await apiClient.patch<RawSettings>('/settings', input)
    return toSettings(data)
  },
}

export const settingsRepository: SettingsRepository = httpSettingsRepository
