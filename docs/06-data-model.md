# 06. Data Model

## 저장소 정책
- 현재(MVP): 브라우저 `localStorage`
- 전환 목표: 서버 영속 저장(관계형 DB 기준)
- 로컬 키: `healing-site:v1`
- 버전드 스키마 사용(`version: 1`)

## Type 모델 (클라이언트 v1)
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

## 서버 전환 데이터 모델(초안)

### missions
- `id` (PK, text)
- `title` (text)
- `description` (text)
- `estimated_minutes` (smallint)
- `tags` (jsonb/text[])
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### healing_records
- `id` (PK, uuid)
- `user_id` (nullable, text) - 로그인 도입 전에는 null 허용
- `device_id` (text, not null)
- `date` (date, not null)
- `mission_id` (FK -> missions.id)
- `completed_at` (timestamptz, not null)
- `source` (text: `local-import` | `client-write` | `server-write`)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Unique: `(device_id, date)`
- 보조 인덱스: `(user_id, date desc)`, `(device_id, completed_at desc)`

### sync_migrations
- `id` (PK, uuid)
- `device_id` (text, not null)
- `imported_count` (int)
- `skipped_count` (int)
- `status` (text: `accepted` | `completed` | `failed`)
- `requested_at` (timestamptz)
- `completed_at` (timestamptz nullable)

## JSON 스키마 수준 예시(localStorage v1)
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

## 마이그레이션 매핑 규칙
- local `records[date]` -> server `healing_records` 1행
- local `totalCompleted`는 파생값으로 취급(서버에서는 count 집계 우선)
- 동일 `device_id + date`가 이미 존재하면 최신 `completedAt` 기준 upsert
- 손상 데이터는 import 시 `skipped` 처리하고 오류 코드 기록

## 규칙
- 같은 날짜는 하나의 완료 기록만 허용
- 미션 선택은 날짜 키 기반 deterministic 방식
- 손상 데이터 발견 시 기본 상태로 복구
- 전환 기간에는 dual-write 후 서버 우선 읽기로 단계 승격
