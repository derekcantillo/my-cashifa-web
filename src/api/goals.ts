import { parseAmount } from '@/lib/parseAmount'
import type {
  CreateGoalContributionInput,
  CreateGoalInput,
  Goal,
  GoalContribution,
  GoalStatus,
  PlanPhase,
  UpdateGoalInput,
} from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

interface RawGoalContribution {
  id: string
  amount: RawAmount
  note: string | null
  contributedAt: string
  createdAt: string
}

interface RawGoal {
  id: string
  name: string
  targetAmount: RawAmount
  currentAmount: RawAmount
  percentage: number
  targetDate: string
  phase: PlanPhase
  status: GoalStatus
  contributions: RawGoalContribution[]
  createdAt: string
  updatedAt: string
}

function toGoalContribution(raw: RawGoalContribution, goalId: string): GoalContribution {
  return { ...raw, goalId, amount: parseAmount(raw.amount) }
}

function toGoal(raw: RawGoal): Goal {
  return {
    ...raw,
    targetAmount: parseAmount(raw.targetAmount),
    currentAmount: parseAmount(raw.currentAmount),
    contributions: raw.contributions.map(contribution => toGoalContribution(contribution, raw.id)),
  }
}

export interface GoalsRepository {
  list(): Promise<Goal[]>
  getById(id: string): Promise<Goal>
  create(input: CreateGoalInput): Promise<Goal>
  update(id: string, input: UpdateGoalInput): Promise<Goal>
  remove(id: string): Promise<void>
  /** Returns the updated goal (a goal that reaches its target becomes COMPLETED). */
  addContribution(id: string, input: CreateGoalContributionInput): Promise<Goal>
}

const httpGoalsRepository: GoalsRepository = {
  async list() {
    const { data } = await apiClient.get<RawGoal[]>('/goals')
    return data.map(toGoal)
  },
  async getById(id) {
    const { data } = await apiClient.get<RawGoal>(`/goals/${id}`)
    return toGoal(data)
  },
  async create(input) {
    const { data } = await apiClient.post<RawGoal>('/goals', input)
    return toGoal(data)
  },
  async update(id, input) {
    const { data } = await apiClient.patch<RawGoal>(`/goals/${id}`, input)
    return toGoal(data)
  },
  async remove(id) {
    await apiClient.delete(`/goals/${id}`)
  },
  async addContribution(id, input) {
    const { data } = await apiClient.post<RawGoal>(`/goals/${id}/contributions`, input)
    return toGoal(data)
  },
}

export const goalsRepository: GoalsRepository = httpGoalsRepository
