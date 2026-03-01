import type { CompleteResult, HealingState, HistoryDay, Mission } from '~/types/healing'
import { completeMissionForDate, buildHistory, createDefaultHealingState, normalizeHealingState, STORAGE_KEY } from '~/utils/healing-state'
import { getDateKey, pickMissionByDate } from '~/utils/mission'

export function useHealingStore() {
  const state = useState<HealingState>('healing-state', () => createDefaultHealingState())
  const hydrated = useState<boolean>('healing-state-hydrated', () => false)

  const loadFromStorage = () => {
    if (!import.meta.client || hydrated.value) {
      return
    }

    const rawValue = localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      hydrated.value = true
      return
    }

    try {
      const parsed = JSON.parse(rawValue)
      state.value = normalizeHealingState(parsed)
    } catch {
      state.value = createDefaultHealingState()
    }

    hydrated.value = true
  }

  const persist = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  const getTodayMission = (): Mission => {
    loadFromStorage()
    return pickMissionByDate(getDateKey())
  }

  const completeToday = (): CompleteResult => {
    loadFromStorage()
    const today = getDateKey()
    const mission = pickMissionByDate(today)

    const result = completeMissionForDate(state.value, today, mission.id, new Date().toISOString())
    if (result.ok) {
      persist()
    }

    return result
  }

  const getHistory = (days = 30): HistoryDay[] => {
    loadFromStorage()
    return buildHistory(state.value, days)
  }

  const resetAll = () => {
    state.value = createDefaultHealingState()
    hydrated.value = true

    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const totalCompleted = computed(() => {
    loadFromStorage()
    return state.value.totalCompleted
  })

  const isTodayCompleted = computed(() => {
    loadFromStorage()
    return Boolean(state.value.records[getDateKey()])
  })

  return {
    getTodayMission,
    completeToday,
    getHistory,
    resetAll,
    totalCompleted,
    isTodayCompleted
  }
}
