import type { CompleteResult, HealingState, HistoryDay, Mission } from '~/types/healing'
import { completeMissionForDate, buildHistory, createDefaultHealingState, normalizeHealingState, STORAGE_KEY } from '~/utils/healing-state'
import { getDateKey, pickMissionByDate } from '~/utils/mission'

export function useHealingStore() {
  const state = useState<HealingState>('healing-state', () => createDefaultHealingState())
  const hydrated = useState<boolean>('healing-state-hydrated', () => false)
  const storageListenerAttached = useState<boolean>('healing-state-storage-listener', () => false)

  const parseStoredState = (rawValue: string | null): HealingState => {
    if (!rawValue) {
      return createDefaultHealingState()
    }

    try {
      return normalizeHealingState(JSON.parse(rawValue))
    } catch {
      return createDefaultHealingState()
    }
  }

  const syncFromStorage = () => {
    if (!import.meta.client) {
      return
    }

    state.value = parseStoredState(localStorage.getItem(STORAGE_KEY))
    hydrated.value = true
  }

  const ensureClientReady = () => {
    if (!import.meta.client) {
      return
    }

    if (!hydrated.value) {
      syncFromStorage()
    }

    if (storageListenerAttached.value) {
      return
    }

    window.addEventListener('storage', (event) => {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key !== null && event.key !== STORAGE_KEY) {
        return
      }

      syncFromStorage()
    })

    storageListenerAttached.value = true
  }

  const persist = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    hydrated.value = true
  }

  const getTodayMission = (): Mission => {
    ensureClientReady()
    return pickMissionByDate(getDateKey())
  }

  const completeToday = (): CompleteResult => {
    ensureClientReady()
    const today = getDateKey()
    const mission = pickMissionByDate(today)

    const result = completeMissionForDate(state.value, today, mission.id, new Date().toISOString())
    if (result.ok) {
      persist()
    }

    return result
  }

  const getHistory = (days = 30): HistoryDay[] => {
    ensureClientReady()
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
    ensureClientReady()
    return state.value.totalCompleted
  })

  const isTodayCompleted = computed(() => {
    ensureClientReady()
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
