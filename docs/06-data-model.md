# 06. Data Model

## MVP 로컬 저장소 정책
- 저장 위치: 브라우저 `localStorage`
- 키: `healing-site:v1`
- 버전드 스키마 사용(`version: 1`)

## MVP Type 모델
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

## MVP JSON 스키마 예시
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

## 서버 전환용 관계형 모델 (Draft)

### `missions`
- 용도: 날짜별 deterministic 선택에 사용되는 미션 마스터
- 컬럼
- `id` (text, PK)
- `title` (text, not null)
- `description` (text, not null)
- `estimated_minutes` (smallint, not null)
- `tags` (jsonb, not null, default `[]`)
- `is_active` (boolean, not null, default `true`)
- `created_at` (timestamptz, not null)
- `updated_at` (timestamptz, not null)

### `healing_records`
- 용도: 사용자(또는 디바이스) 단위 일일 완료 기록 저장
- 컬럼
- `user_id` (uuid, not null)
- `record_date` (date, not null)
- `mission_id` (text, not null, FK -> `missions.id`)
- `completed_at` (timestamptz, not null)
- `source` (text, not null, enum: `web | import`)
- `created_at` (timestamptz, not null)
- `updated_at` (timestamptz, not null)
- 제약
- PK: (`user_id`, `record_date`)로 하루 1건 보장

### `sync_migrations`
- 용도: 로컬 -> 서버 import 상태/오류 추적
- 컬럼
- `user_id` (uuid, PK)
- `phase` (text, not null, enum: `A_LOCAL | B_IMPORT | C_DUAL_WRITE | D_SERVER_ONLY`)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)
- `imported_count` (int, not null, default 0)
- `failed_count` (int, not null, default 0)
- `last_error` (text)
- `updated_at` (timestamptz, not null)

## 마이그레이션 매핑 규칙
- `localStorage.records[date]` -> `healing_records(user_id, record_date, mission_id, completed_at, source='import')`
- 로컬 `date(YYYY-MM-DD)`는 서버 `record_date(date)`로 변환
- 로컬 `completedAt(ISO)`는 서버 `completed_at(timestamptz)`로 변환
- 동일 `user_id + record_date` 충돌 시 최신 `completed_at` 기준으로 upsert
- `totalCompleted`는 저장하지 않고 `healing_records` 집계값(`COUNT(*)`)으로 계산
- 로컬 데이터 파싱 오류 건은 `sync_migrations.failed_count`에 누적

## 공통 규칙
- 같은 날짜는 하나의 완료 기록만 허용
- 미션 선택은 날짜 키 기반 deterministic 방식
- 손상 데이터 발견 시 기본 상태로 복구
