import type { CompleteResult, HealingState, HistoryDay, StoredHealingRecord } from '~/types/healing'
import { getDateKey, getMissionById, getPraiseMessage, pickMissionByDate } from '~/utils/mission'

const DEFAULT_DAYS = 30
const MAX_DAYS = 30
const MIN_DAYS = 1

export const STORAGE_KEY = 'healing-site:v1'

export function createDefaultHealingState(): HealingState {
  return {
    version: 1,
    totalCompleted: 0,
    records: {}
  }
}

function isStoredRecord(value: unknown): value is StoredHealingRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.missionId === 'string' && typeof record.completedAt === 'string'
}

export function normalizeHealingState(input: unknown): HealingState {
  const fallback = createDefaultHealingState()

  if (!input || typeof input !== 'object') {
    return fallback
  }

  const candidate = input as Record<string, unknown>
  if (candidate.version !== 1) {
    return fallback
  }

  const totalCompleted =
    typeof candidate.totalCompleted === 'number' && Number.isFinite(candidate.totalCompleted)
      ? Math.max(0, Math.floor(candidate.totalCompleted))
      : 0

  const recordsInput = candidate.records
  const records: Record<string, StoredHealingRecord> = {}

  if (recordsInput && typeof recordsInput === 'object') {
    for (const [dateKey, value] of Object.entries(recordsInput)) {
      if (isStoredRecord(value)) {
        records[dateKey] = {
          missionId: value.missionId,
          completedAt: value.completedAt
        }
      }
    }
  }

  return {
    version: 1,
    totalCompleted,
    records
  }
}

export function completeMissionForDate(
  state: HealingState,
  dateKey: string,
  missionId: string,
  completedAtISO: string
): CompleteResult {
  const existingRecord = state.records[dateKey]
  if (existingRecord) {
    return {
      ok: false,
      alreadyCompleted: true,
      praiseMessage: '오늘의 미션은 이미 기록되어 있어요. 지금도 충분히 잘하고 있어요.',
      totalCompleted: state.totalCompleted
    }
  }

  state.records[dateKey] = {
    missionId,
    completedAt: completedAtISO
  }

  state.totalCompleted += 1

  return {
    ok: true,
    alreadyCompleted: false,
    praiseMessage: getPraiseMessage(state.totalCompleted),
    totalCompleted: state.totalCompleted
  }
}

export function buildHistory(state: HealingState, days: number = DEFAULT_DAYS): HistoryDay[] {
  const normalizedDays = Math.min(Math.max(Math.floor(days), MIN_DAYS), MAX_DAYS)
  const history: HistoryDay[] = []

  for (let offset = 0; offset < normalizedDays; offset += 1) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - offset)

    const dateKey = getDateKey(targetDate)
    const storedRecord = state.records[dateKey]

    history.push({
      date: dateKey,
      completed: Boolean(storedRecord),
      missionTitle: storedRecord
        ? getMissionById(storedRecord.missionId)?.title ?? pickMissionByDate(dateKey).title
        : undefined,
      completedAt: storedRecord?.completedAt
    })
  }

  return history
}
