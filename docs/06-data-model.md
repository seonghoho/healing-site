# 06. Data Model

## 저장소 정책
- 저장 위치: 브라우저 `localStorage`
- 키: `healing-site:v1`
- 버전드 스키마 사용(`version: 1`)

## Type 모델
```ts
interface Mission {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  tags: string[]
}

interface HealingRecord {
  date: string // YYYY-MM-DD
  missionId: string
  completedAt: string // ISO datetime
}

interface HealingState {
  version: 1
  totalCompleted: number
  records: Record<string, {
    missionId: string
    completedAt: string
  }>
}

interface HistoryDay {
  date: string
  completed: boolean
  missionTitle?: string
  completedAt?: string
}
```

## JSON 스키마 수준 예시
```json
{
  "version": 1,
  "totalCompleted": 12,
  "records": {
    "2026-03-01": {
      "missionId": "breath-3",
      "completedAt": "2026-03-01T09:20:00.000Z"
    }
  }
}
```

## 규칙
- 같은 날짜는 하나의 완료 기록만 허용
- 미션 선택은 날짜 키 기반 deterministic 방식
- 손상 데이터 발견 시 기본 상태로 복구
