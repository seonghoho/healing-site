# 06. Data Model

## MVP 로컬 저장소 정책
- 저장 위치: 브라우저 `localStorage`
- 키
  - 상태: `healing-site:v1`
  - 익명 식별자: `healing-site:anon-id`
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

## 서버 전환용 관계형 모델 (v1 Draft)

### `users`
- 용도: 익명 시작(무인증)과 추후 로그인 계정 연결을 모두 수용하는 사용자 루트
- 컬럼
- `id` (uuid, PK)
- `auth_provider` (text, not null, enum: `anonymous | google | apple | email`)
- `auth_subject` (text, null, unique with provider, 로그인 전에는 null)
- `status` (text, not null, enum: `active | merged | deleted`)
- `created_at` (timestamptz, not null)
- `updated_at` (timestamptz, not null)

### `devices`
- 용도: 기기 단위 식별자(`anon_id`) 관리 및 이후 계정 연결
- 컬럼
- `id` (uuid, PK)
- `device_key_hash` (text, not null, unique)
- `first_seen_at` (timestamptz, not null)
- `last_seen_at` (timestamptz, not null)
- `created_at` (timestamptz, not null)

### `user_devices`
- 용도: 사용자와 디바이스 매핑(익명 사용자 생성 시 1:1, 로그인 후 다:1 허용)
- 컬럼
- `user_id` (uuid, not null, FK -> `users.id`)
- `device_id` (uuid, not null, FK -> `devices.id`)
- `is_primary` (boolean, not null, default `false`)
- `linked_at` (timestamptz, not null)
- 제약
- PK: (`user_id`, `device_id`)

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
- 용도: 사용자 단위 일일 완료 기록 저장
- 컬럼
- `user_id` (uuid, not null, FK -> `users.id`)
- `record_date` (date, not null)
- `mission_id` (text, not null, FK -> `missions.id`)
- `completed_at` (timestamptz, not null)
- `source` (text, not null, enum: `web | import | backfill`)
- `schema_version` (smallint, not null, default `1`)
- `created_at` (timestamptz, not null)
- `updated_at` (timestamptz, not null)
- 제약
- PK: (`user_id`, `record_date`)로 하루 1건 보장

### `sync_migrations`
- 용도: 로컬 -> 서버 import 상태/오류 추적
- 컬럼
- `user_id` (uuid, PK, FK -> `users.id`)
- `phase` (text, not null, enum: `A_LOCAL | B_IMPORT | C_DUAL_WRITE | D_SERVER_ONLY`)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)
- `imported_count` (int, not null, default 0)
- `failed_count` (int, not null, default 0)
- `last_error` (text)
- `updated_at` (timestamptz, not null)

## 버전 호환 정책 (local -> server)
- 지원 버전
  - 로컬 상태 스키마: `version=1`
  - API payload 스키마: `schemaVersion=1`
  - 서버 저장 스키마: `healing_records.schema_version=1`
- 원칙
  - `local v1` -> `server v1`은 손실 없이 1:1 변환
  - 지원하지 않는 상위 버전은 서버 저장을 거부하고(`UNSUPPORTED_SCHEMA_VERSION`) 로컬 모드 유지
  - `totalCompleted`는 전송/저장하지 않고 서버 집계로 계산

## 필드 호환 매핑 (local -> API -> server)
| Local (`healing-site:v1`) | API (`POST /progress/complete`) | Server (`healing_records`) | 변환 규칙 |
| --- | --- | --- | --- |
| `version` | `schemaVersion` | `schema_version` | 값 그대로 전달 (`1`) |
| `records[date]` key | `date` | `record_date` | `YYYY-MM-DD` 검증 후 `date` 타입 저장 |
| `records[date].missionId` | `missionId` | `mission_id` | 문자열 그대로 저장 |
| `records[date].completedAt` | `completedAt` | `completed_at` | ISO-8601 UTC 검증 후 저장 |
| `localStorage['healing-site:anon-id']` | `X-Anon-Id` 헤더 | `devices.device_key_hash` + `user_devices` | 원문 미저장, 해시 후 매핑 |
| `totalCompleted` | (전송 안 함) | (집계 계산) | `COUNT(*)`로 계산 |

## 마이그레이션 절차 (local -> server)
1. 클라이언트가 `healing-site:v1` 로드 후 `version` 검증
2. `records`를 날짜 오름차순으로 순회하며 `POST /progress/complete` 전송
3. idempotent key는 `actor_id + date`로 처리하여 재시도 시 중복 생성 방지
4. 성공 건수/실패 건수를 `sync_migrations(imported_count, failed_count)`에 반영
5. 검증 통과 후 Phase C에서 dual-write 활성화
6. 운영 지표 기준 충족 시 Phase D(server-only)로 승격

## 익명 시작 -> 로그인 전환 데이터 플로우
1. 앱 첫 방문 시 클라이언트가 `anon_id`를 생성/보관하고 서버에는 해시만 전송
2. 서버는 `devices` 조회 후 없으면 생성, `anonymous` 사용자(`users.auth_provider='anonymous'`) 생성
3. `user_devices`로 익명 사용자와 기기를 연결하고 이후 기록은 해당 `user_id`로 축적
4. 로그인 도입 시 동일 기기에서 인증 완료하면 로그인 사용자 생성/조회
5. 익명 사용자의 `healing_records`를 로그인 사용자로 병합하고 익명 사용자는 `merged` 처리

## 단계별 저장 전략
- Phase A (local-only): 로컬에만 write/read
- Phase B (import): 최초 1회 `records` 일괄 import + 서버 검증
- Phase C (dual-write): write는 로컬/서버 동시 반영, read는 서버 우선 + 로컬 fallback
- Phase D (server-only): 서버만 write/read, 로컬은 캐시 또는 마이그레이션 백업 용도

## 공통 규칙
- 같은 날짜는 하나의 완료 기록만 허용
- 동일 날짜에 상이한 `mission_id` 저장 시 `409 MISSION_CONFLICT`
- 미션 선택은 날짜 키 기반 deterministic 방식
- 손상 데이터 발견 시 기본 상태로 복구
