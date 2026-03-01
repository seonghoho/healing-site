# 09. API Spec (Server Transition Draft)

## 목적/범위
- 목적: localStorage 기반 MVP를 서버 저장 구조로 전환할 때의 API 계약을 선행 정의
- 범위: 미션 조회, 일일 완료 기록 upsert, 히스토리 조회, 동기화/마이그레이션 상태 확인
- 비범위(후속): 소셜 로그인, 멀티 디바이스 충돌 UI, 관리자 대시보드

## 버전/기본 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json; charset=utf-8`
- 시간 표준: ISO-8601 UTC (`2026-03-01T09:20:00.000Z`)
- 날짜 표준: `YYYY-MM-DD`
- 멱등성:
  - `PUT /records/{date}`는 날짜 단위 upsert로 멱등 처리
  - 동일 payload 재전송 시 동일 응답(200)

## 인증 모델 (MVP 이후)
- 1단계(전환 초기): 익명 디바이스 토큰(`X-Device-Id`) 허용
- 2단계(안정화): OAuth/OIDC 기반 사용자 토큰 + 디바이스 보조 식별자
- 서버는 `deviceId + date`를 최소 중복 방지 단위로 사용

## 엔터티 요약

### Mission
```json
{
  "id": "breath-3",
  "title": "3분 호흡",
  "description": "눈을 감고 호흡에 집중합니다.",
  "estimatedMinutes": 3,
  "tags": ["breathing", "beginner"]
}
```

### HealingRecord
```json
{
  "date": "2026-03-01",
  "missionId": "breath-3",
  "completedAt": "2026-03-01T09:20:00.000Z",
  "source": "server"
}
```

## API 상세

### 1) 오늘 미션 조회
`GET /missions/today?date=2026-03-01`

- 설명: deterministic 규칙 기반으로 특정 날짜의 미션 반환
- Query:
  - `date`(optional): 미지정 시 서버의 오늘 날짜
- Response 200
```json
{
  "date": "2026-03-01",
  "mission": {
    "id": "breath-3",
    "title": "3분 호흡",
    "description": "눈을 감고 호흡에 집중합니다.",
    "estimatedMinutes": 3,
    "tags": ["breathing", "beginner"]
  }
}
```

### 2) 일일 완료 기록 저장(멱등 upsert)
`PUT /records/2026-03-01`

- 설명: 날짜당 1건 정책으로 완료 기록 생성 또는 교체
- Request
```json
{
  "missionId": "breath-3",
  "completedAt": "2026-03-01T09:20:00.000Z"
}
```
- Response 200
```json
{
  "date": "2026-03-01",
  "missionId": "breath-3",
  "completedAt": "2026-03-01T09:20:00.000Z",
  "upserted": true
}
```
- Error
  - 400: 날짜 포맷/본문 검증 실패
  - 409: 미션 정책 위반(예: 존재하지 않는 missionId)

### 3) 최근 기록 조회
`GET /records?from=2026-02-01&to=2026-03-01&limit=30`

- 설명: 기간 기반 완료 기록 조회
- Response 200
```json
{
  "items": [
    {
      "date": "2026-03-01",
      "missionId": "breath-3",
      "completedAt": "2026-03-01T09:20:00.000Z"
    }
  ],
  "total": 1
}
```

### 4) 동기화 상태 조회
`GET /sync/status`

- 설명: 클라이언트 전환 단계에서 로컬->서버 마이그레이션 상태 확인
- Response 200
```json
{
  "migrationPhase": "dual-write",
  "lastSyncedAt": "2026-03-01T09:21:00.000Z",
  "recordCount": 12
}
```

### 5) 초기 업로드(로컬 일괄 이관)
`POST /sync/import`

- 설명: localStorage v1 데이터를 서버로 일괄 전송 (최초 1회 권장)
- Request
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
- Response 202
```json
{
  "accepted": true,
  "imported": 12,
  "skipped": 0,
  "migrationPhase": "dual-write"
}
```

## 오류 응답 포맷
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "date must be YYYY-MM-DD",
    "details": {
      "field": "date"
    }
  }
}
```

## 전환 단계 (MVP 이후)
1. **Phase A - Local only (현행)**
   - 읽기/쓰기 모두 localStorage
2. **Phase B - Import + Dual Write**
   - 앱 시작 시 `POST /sync/import` 1회 시도
   - 기록 저장은 로컬 + 서버 동시 쓰기
3. **Phase C - Server Read Primary**
   - 히스토리/누적 수치는 서버 읽기 우선, 로컬은 fallback
4. **Phase D - Server only**
   - 로컬 저장 중단, 캐시는 성능 용도만 유지

## 전환 완료 기준
- 최근 30일 활성 사용자 기준:
  - `sync/import` 성공률 99% 이상
  - 서버-로컬 총 완료 수 mismatch 0.5% 미만
  - `PUT /records/{date}` 95p 응답시간 300ms 이하
- 기준 충족 후 Phase C -> D 승격
