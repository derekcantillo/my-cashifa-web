import type { Institution } from '@/types'

import { apiClient } from './client'

export interface InstitutionsRepository {
  list(): Promise<Institution[]>
  create(name: string): Promise<Institution>
  rename(id: string, name: string): Promise<Institution>
  remove(id: string): Promise<void>
}

const httpInstitutionsRepository: InstitutionsRepository = {
  async list() {
    const { data } = await apiClient.get<Institution[]>('/institutions')
    return data
  },
  async create(name) {
    const { data } = await apiClient.post<Institution>('/institutions', { name })
    return data
  },
  async rename(id, name) {
    const { data } = await apiClient.patch<Institution>(`/institutions/${id}`, { name })
    return data
  },
  async remove(id) {
    await apiClient.delete(`/institutions/${id}`)
  },
}

export const institutionsRepository: InstitutionsRepository = httpInstitutionsRepository
