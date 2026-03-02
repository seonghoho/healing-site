import type { Mission } from '~/types/healing'

export const MISSIONS: Mission[] = [
  {
    id: 'breath-3',
    title: '깊은 호흡 3번',
    description: '지금 있는 자리에서 천천히 세 번만 숨을 고르고 몸의 긴장을 느슨하게 해보세요.',
    estimatedMinutes: 1,
    tags: ['호흡', '안정']
  },
  {
    id: 'water',
    title: '물 한 컵 마시기',
    description: '한 모금씩 천천히 물을 마시며 목과 어깨 힘이 풀리는 감각을 살펴보세요.',
    estimatedMinutes: 2,
    tags: ['회복', '리듬']
  },
  {
    id: 'stretch-neck',
    title: '목과 어깨 스트레칭',
    description: '양쪽 어깨를 가볍게 돌리고 목을 좌우로 부드럽게 기울여주세요.',
    estimatedMinutes: 3,
    tags: ['스트레칭', '이완']
  },
  {
    id: 'sunlight',
    title: '창가에서 1분 머물기',
    description: '창밖을 보며 빛과 공기의 느낌을 받아들이는 시간을 가져보세요.',
    estimatedMinutes: 2,
    tags: ['전환', '휴식']
  },
  {
    id: 'gratitude-note',
    title: '오늘 고마운 것 1개 적기',
    description: '사소해도 좋아요. 오늘 버틸 힘이 되었던 장면 하나를 기록해보세요.',
    estimatedMinutes: 3,
    tags: ['기록', '감정']
  },
  {
    id: 'eye-break',
    title: '눈 휴식 20초',
    description: '화면에서 눈을 떼고 먼 곳을 바라보며 눈 주변 힘을 살짝 풀어주세요.',
    estimatedMinutes: 1,
    tags: ['디지털휴식', '회복']
  },
  {
    id: 'slow-walk',
    title: '천천히 5분 걷기',
    description: '속도를 낮춘 걸음으로 몸의 리듬을 되찾는 짧은 산책을 해보세요.',
    estimatedMinutes: 5,
    tags: ['걷기', '리듬']
  },
  {
    id: 'self-kindness',
    title: '나에게 다정한 한 문장',
    description: '오늘의 나에게 건네고 싶은 부드러운 문장을 하나 적어보세요.',
    estimatedMinutes: 2,
    tags: ['자기돌봄', '감정']
  }
]

const LOW_INTENSITY_MISSION_ID_SET = new Set([
  'breath-3',
  'water',
  'sunlight',
  'eye-break',
  'self-kindness'
])

export const LOW_INTENSITY_MISSIONS: Mission[] = MISSIONS.filter((mission) =>
  LOW_INTENSITY_MISSION_ID_SET.has(mission.id)
)

const PRAISE_MESSAGES = [
  '좋아요. 오늘의 작은 회복이 기록되었어요.',
  '충분히 잘 해냈어요. 지금의 속도가 아주 좋아요.',
  '한 걸음이 쌓이고 있어요. 오늘도 마음을 챙겼네요.',
  '지금 이 선택이 내일의 여유를 만들어줘요.'
]

const BURNOUT_PRAISE_MESSAGE = '좋아요. 오늘의 작은 회복이 기록되었어요.'

export function getDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function pickMissionByDate(dateKey: string, missionPool: Mission[] = MISSIONS): Mission {
  if (missionPool.length === 0) {
    throw new Error('Mission pool is empty')
  }

  const missionIndex = hashString(dateKey) % missionPool.length
  return missionPool[missionIndex]
}

export function getMissionPoolByMode(isBurnoutMode: boolean): Mission[] {
  if (isBurnoutMode && LOW_INTENSITY_MISSIONS.length > 0) {
    return LOW_INTENSITY_MISSIONS
  }

  return MISSIONS
}

export function pickMissionByMode(dateKey: string, isBurnoutMode: boolean): Mission {
  return pickMissionByDate(dateKey, getMissionPoolByMode(isBurnoutMode))
}

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((mission) => mission.id === id)
}

export function getPraiseMessage(totalCompleted: number, useBurnoutTone: boolean = false): string {
  if (useBurnoutTone) {
    return BURNOUT_PRAISE_MESSAGE
  }

  const index = Math.max(totalCompleted - 1, 0) % PRAISE_MESSAGES.length
  return PRAISE_MESSAGES[index]
}
