# 09. API Spec (Draft)

## 목적
- MVP 이후 `localStorage` 기반 저장을 서버 저장으로 전환하기 위한 API 초안
- 초기 전환 단계에서는 Import + Dual-write를 통해 점진적으로 서버 read/write 전환

## 버전 및 공통 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 날짜: `YYYY-MM-DD` (사용자 로컬 날짜 기준)
- 시간: ISO 8601 UTC (`2026-03-01T09:20:00.000Z`)
- 같은 날짜 기록은 idempotent upsert로 처리

## 인증 단계 (MVP 이후)
- Phase A~B: 익명 사용자 기준 `X-Client-Id` 헤더 허용
- Phase C~D: 인증 도입 시 `Authorization: Bearer <token>` 전환

## 엔드포인트

### 1) 오늘의 미션 조회
- `GET /missions/today?date=YYYY-MM-DD`
- 설명: 특정 날짜(미지정 시 오늘) 기준 deterministic 미션 1건 반환

요청 예시
```http
GET /api/v1/missions/today?date=2026-03-01
X-Client-Id: 8d9f...
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

### 2) 일일 기록 upsert
- `PUT /records/{date}`
- 설명: 지정 날짜의 완료 기록 생성/갱신 (동일 날짜 1건 보장)

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

### 3) 기간 기록 조회
- `GET /records?from=YYYY-MM-DD&to=YYYY-MM-DD`
- 설명: 기간 내 일일 완료 기록 리스트 반환

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
  ]
}
```

### 4) 동기화 상태 조회
- `GET /sync/status`
- 설명: 전환 단계 및 import 지표 확인

응답 예시 (200)
```json
{
  "phase": "C_DUAL_WRITE",
  "importedCount": 28,
  "failedCount": 0,
  "lastSyncedAt": "2026-03-02T01:00:00.000Z"
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
- Phase B: Import-only (`POST /sync/import`으로 초기 적재)
- Phase C: Dual-write (로컬+서버 동시 쓰기, 읽기는 서버 우선/로컬 fallback)
- Phase D: Server-only (서버 read/write 단일화)

## 전환 완료 기준 (Phase C -> D)
- `POST /sync/import` 성공률 99% 이상
- 서버-로컬 record mismatch 0.5% 미만
- `PUT /records/{date}` p95 300ms 이하
