# 09. API Spec (Draft)

## 목적
- MVP `localStorage` 저장을 서버 저장으로 안전하게 전환하기 위한 API 초안
- 인증 없이 시작(익명 device id)하되, 추후 로그인 전환이 가능한 계약 정의

## 버전 및 공통 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 날짜: `YYYY-MM-DD` (사용자 로컬 날짜 기준)
- 시간: ISO 8601 UTC (`2026-03-01T09:20:00.000Z`)
- 동일 날짜 기록은 idempotent upsert
- 요청 추적: `X-Request-Id`(optional), 응답에서 `requestId` 반사

## 식별/인증 전략
- Phase A~B (무인증 시작):
  - 클라이언트는 `X-Device-Id` 전송 (랜덤 UUID 권장)
  - 서버는 해시 저장 후 `anonUserId`를 발급/재사용
- Phase C~D (로그인 전환 병행):
  - 인증 시 `Authorization: Bearer <token>` 사용
  - 토큰의 사용자와 `X-Device-Id` 매핑을 병합 API로 연결

## 엔드포인트

### 1) 익명 사용자 세션 시작/조회
- `POST /users/anon`
- 설명: `X-Device-Id` 기반 익명 사용자 생성 또는 재사용

요청 예시
```http
POST /api/v1/users/anon
X-Device-Id: 75ac5f95-4fcb-4f3f-83f7-3c67f0c4b4a8
```

응답 예시 (200)
```json
{
  "user": {
    "id": "2f6d0a48-9f7f-4893-afbb-6acb56168c7d",
    "type": "anonymous"
  },
  "migration": {
    "phase": "A_LOCAL"
  }
}
```

### 2) 오늘의 미션 조회
- `GET /missions/today?date=YYYY-MM-DD`
- 설명: 특정 날짜(미지정 시 오늘) 기준 deterministic 미션 1건 반환

요청 예시
```http
GET /api/v1/missions/today?date=2026-03-01
X-Device-Id: 75ac5f95-4fcb-4f3f-83f7-3c67f0c4b4a8
```

응답 예시 (200)
```json
{
  "date": "2026-03-01",
  "mission": {
    "id": "breath-3",
    "title": "3분 호흡 정리",
    "description": "천천히 들이쉬고 내쉬며 호흡에 집중하세요.",
    "estimatedMinutes": 3,
    "tags": ["breathing", "focus"]
  }
}
```

### 3) 일일 기록 upsert
- `PUT /progress/{date}`
- 설명: 지정 날짜 완료 기록 생성/갱신 (동일 날짜 1건)

요청 본문 예시
```json
{
  "missionId": "breath-3",
  "completedAt": "2026-03-01T09:20:00.000Z",
  "source": "web"
}
```

응답 예시 (200)
```json
{
  "date": "2026-03-01",
  "missionId": "breath-3",
  "completedAt": "2026-03-01T09:20:00.000Z",
  "updated": true
}
```

### 4) 히스토리 조회
- `GET /history?from=YYYY-MM-DD&to=YYYY-MM-DD`
- 설명: 기간 내 완료 기록 리스트 반환

응답 예시 (200)
```json
{
  "items": [
    {
      "date": "2026-03-01",
      "missionId": "breath-3",
      "completedAt": "2026-03-01T09:20:00.000Z"
    },
    {
      "date": "2026-03-02",
      "missionId": "walk-10",
      "completedAt": "2026-03-02T10:00:00.000Z"
    }
  ],
  "summary": {
    "totalCompleted": 2
  }
}
```

### 5) 초기 import 실행
- `POST /sync/import`
- 설명: 로컬 상태를 서버로 업로드해 초기 데이터 동기화 수행

요청 본문 예시
```json
{
  "version": 1,
  "records": {
    "2026-03-01": {
      "missionId": "breath-3",
      "completedAt": "2026-03-01T09:20:00.000Z"
    }
  }
}
```

응답 예시 (202)
```json
{
  "status": "accepted",
  "importedCount": 1,
  "failedCount": 0
}
```

### 6) 동기화 상태 조회
- `GET /sync/status`
- 설명: 현재 전환 단계 및 import 지표 확인

응답 예시 (200)
```json
{
  "phase": "C_DUAL_WRITE",
  "importedCount": 28,
  "failedCount": 0,
  "lastSyncedAt": "2026-03-02T01:00:00.000Z"
}
```

### 7) 로그인 전환 병합
- `POST /users/link`
- 설명: 로그인 사용자와 현재 익명 사용자 데이터 병합
- 인증: `Authorization: Bearer <token>` 필수

요청 본문 예시
```json
{
  "anonUserId": "2f6d0a48-9f7f-4893-afbb-6acb56168c7d",
  "mergeStrategy": "latest_completed_at_wins"
}
```

응답 예시 (200)
```json
{
  "userId": "f2a97093-eb4a-4d8f-8be6-cb4ad4ef46d1",
  "mergedFrom": "2f6d0a48-9f7f-4893-afbb-6acb56168c7d",
  "migratedRecords": 14
}
```

## 에러 포맷
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "date must be YYYY-MM-DD",
    "details": {
      "field": "date"
    },
    "requestId": "req_123"
  }
}
```

## 전환 단계 (Migration Plan)
- Phase A: Local-only (`localStorage` read/write)
- Phase B: Import-only (`POST /sync/import` 초기 적재)
- Phase C: Dual-write (로컬+서버 동시 쓰기, 읽기는 서버 우선/로컬 fallback)
- Phase D: Server-only (서버 read/write 단일화)

## Phase C -> D 승격 기준
- `POST /sync/import` 성공률 99% 이상
- 서버-로컬 record mismatch 0.5% 미만
- `PUT /progress/{date}` p95 300ms 이하
- `POST /users/link` 병합 실패율 1% 미만
