import { describe, expect, it } from 'vitest'
import { buildHistory, completeMissionForDate, createDefaultHealingState } from '../src/utils/healing-state'
import { getDateKey, pickMissionByDate } from '../src/utils/mission'

describe('mission selection', () => {
  it('returns the same mission for the same date key', () => {
    const dateKey = '2026-03-01'

    const first = pickMissionByDate(dateKey)
    const second = pickMissionByDate(dateKey)

    expect(first.id).toBe(second.id)
  })

  it('can return a different mission for a different date key', () => {
    const missionIds = [
      pickMissionByDate('2026-03-01').id,
      pickMissionByDate('2026-03-02').id,
      pickMissionByDate('2026-03-03').id,
      pickMissionByDate('2026-03-04').id,
      pickMissionByDate('2026-03-05').id
    ]

    expect(new Set(missionIds).size).toBeGreaterThan(1)
  })
})

describe('healing state', () => {
  it('increments completion only once for the same day', () => {
    const state = createDefaultHealingState()
    const today = getDateKey(new Date('2026-03-01T08:00:00+09:00'))

    const first = completeMissionForDate(state, today, 'breath-3', '2026-03-01T08:00:00.000Z')
    const second = completeMissionForDate(state, today, 'breath-3', '2026-03-01T08:30:00.000Z')

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)
    expect(state.totalCompleted).toBe(1)
  })

  it('returns 30 days history by default', () => {
    const state = createDefaultHealingState()
    const history = buildHistory(state, 30)

    expect(history).toHaveLength(30)
  })
})
