export interface Mission {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  tags: string[]
}

export interface HealingRecord {
  date: string
  missionId: string
  completedAt: string
}

export interface StoredHealingRecord {
  missionId: string
  completedAt: string
}

export interface HealingState {
  version: 1
  totalCompleted: number
  records: Record<string, StoredHealingRecord>
}

export interface HistoryDay {
  date: string
  completed: boolean
  missionTitle?: string
  completedAt?: string
}

export interface CompleteResult {
  ok: boolean
  alreadyCompleted: boolean
  praiseMessage: string
  totalCompleted: number
}
