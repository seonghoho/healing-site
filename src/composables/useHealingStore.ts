import type { CompleteResult, HealingState, HistoryDay, Mission } from '~/types/healing'
import { completeMissionForDate, buildHistory, createDefaultHealingState, normalizeHealingState, STORAGE_KEY } from '~/utils/healing-state'
import { getDateKey, getMissionById, getPraiseMessage, pickMissionByMode } from '~/utils/mission'

const BURNOUT_MODE_STORAGE_KEY = 'healing-site:burnout-mode:v1'

export function useHealingStore() {
  const state = useState<HealingState>('healing-state', () => createDefaultHealingState())
  const burnoutMode = useState<boolean>('healing-burnout-mode', () => false)
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

  const parseStoredBurnoutMode = (rawValue: string | null): boolean => {
    return rawValue === '1' || rawValue === 'true'
  }

  const syncFromStorage = () => {
    if (!import.meta.client) {
      return
    }

    state.value = parseStoredState(localStorage.getItem(STORAGE_KEY))
    burnoutMode.value = parseStoredBurnoutMode(localStorage.getItem(BURNOUT_MODE_STORAGE_KEY))
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

      if (event.key !== null && event.key !== STORAGE_KEY && event.key !== BURNOUT_MODE_STORAGE_KEY) {
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

  const persistBurnoutMode = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(BURNOUT_MODE_STORAGE_KEY, burnoutMode.value ? '1' : '0')
    hydrated.value = true
  }

  const getMissionForDate = (dateKey: string): Mission => {
    const storedRecord = state.value.records[dateKey]
    if (storedRecord) {
      return getMissionById(storedRecord.missionId) ?? pickMissionByMode(dateKey, burnoutMode.value)
    }

    return pickMissionByMode(dateKey, burnoutMode.value)
  }

  const getTodayMission = (): Mission => {
    ensureClientReady()
    return getMissionForDate(getDateKey())
  }

  const completeToday = (): CompleteResult => {
    ensureClientReady()
    const today = getDateKey()
    const mission = getMissionForDate(today)

    const result = completeMissionForDate(state.value, today, mission.id, new Date().toISOString())
    if (result.ok) {
      persist()
    }

    if (result.ok && burnoutMode.value) {
      return {
        ...result,
        praiseMessage: getPraiseMessage(result.totalCompleted, true)
      }
    }

    return result
  }

  const setBurnoutMode = (enabled: boolean) => {
    ensureClientReady()
    burnoutMode.value = enabled
    persistBurnoutMode()
  }

  const toggleBurnoutMode = () => {
    setBurnoutMode(!burnoutMode.value)
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
      localStorage.removeItem(BURNOUT_MODE_STORAGE_KEY)
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
    burnoutMode,
    setBurnoutMode,
    toggleBurnoutMode,
    totalCompleted,
    isTodayCompleted
  }
}
