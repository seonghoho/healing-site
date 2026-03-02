# 09. API Spec (v1 Draft)

## 목적
- MVP `localStorage` 저장에서 서버 저장으로 전환하기 위한 v1 API 계약 정의
- 로그인 없이 시작 가능한 `anon_id` 전략과 로그인 전환 시 데이터 연속성을 보장

## 범위 (v1)
- `GET /missions/today`
- `POST /progress/complete`
- `GET /history`

## 버전 및 공통 규칙
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 날짜: `YYYY-MM-DD` (사용자 로컬 날짜 기준)
- 시간: ISO 8601 UTC (`2026-03-02T08:30:00.000Z`)
- 공통 헤더
  - `X-Request-Id` (optional): 요청 추적 ID
  - `X-Anon-Id` (로그인 전 필수): UUIDv4

## `anon_id` 발급/보관 전략 (확정)
- 발급
  - 앱 첫 실행 시 `crypto.randomUUID()`로 `anon_id` 1회 생성
  - 생성 값은 클라이언트에서만 원문 보관
- 보관
  - 로컬 키: `localStorage['healing-site:anon-id']`
  - 값이 없거나 UUID 검증 실패 시 새 값 재발급 후 덮어씀
- 전송
  - 로그인 전 모든 API 요청에 `X-Anon-Id`로 전달
  - 서버는 원문 미저장, 해시(`device_key_hash`)만 저장
- 로그인 전환
  - 로그인 도입 시 `Authorization: Bearer <token>` + `X-Anon-Id` 동시 허용
  - 서버는 `X-Anon-Id` 기반 기록을 계정으로 병합 후 계정 식별자로 고정

## 서버 전환 업로드/동기화 시나리오
1. 부팅 시 로컬 `healing-site:v1`과 `healing-site:anon-id` 로드
2. Phase B(import)에서 로컬 `records`를 날짜 오름차순으로 `POST /progress/complete` 업로드
3. 업로드 후 `GET /history`로 서버 건수와 로컬 건수 비교
4. 검증 성공 시 Phase C(dual-write): 완료 시 로컬+서버 동시 저장
5. 운영 지표 충족 시 Phase D(server-only): 서버 우선 저장/조회로 전환

재시도 규칙
- `POST /progress/complete`는 `actor_id + date` 기준 idempotent upsert
- 네트워크 실패 시 동일 payload 재전송 허용

## 엔드포인트

### 1) 오늘의 미션 조회
- `GET /missions/today?date=YYYY-MM-DD`
- 설명: 특정 날짜(미지정 시 오늘)의 deterministic 미션 1건 반환

요청 예시
```http
GET /api/v1/missions/today?date=2026-03-02
X-Anon-Id: 75ac5f95-4fcb-4f3f-83f7-3c67f0c4b4a8
X-Request-Id: req_9fda
```

응답 예시 (200)
```json
{
  "date": "2026-03-02",
  "mission": {
    "id": "breath-3",
    "title": "3분 호흡 정리",
    "description": "천천히 들이쉬고 내쉬며 호흡에 집중하세요.",
    "estimatedMinutes": 3,
    "tags": ["breathing", "focus"]
  },
  "requestId": "req_9fda"
}
```

상태 코드
- `200 OK`: 정상 조회
- `400 Bad Request`: 날짜 형식 오류
- `404 Not Found`: 활성 미션 없음
- `429 Too Many Requests`: 요청 제한 초과
- `500 Internal Server Error`: 서버 오류

### 2) 완료 기록 저장 (idempotent upsert)
- `POST /progress/complete`
- 설명: `actor_id(anon/login) + date`를 unique key로 완료 기록 생성/갱신

요청 예시
```http
POST /api/v1/progress/complete
X-Anon-Id: 75ac5f95-4fcb-4f3f-83f7-3c67f0c4b4a8
Content-Type: application/json

{
  "schemaVersion": 1,
  "date": "2026-03-02",
  "missionId": "breath-3",
  "completedAt": "2026-03-02T08:30:00.000Z",
  "source": "web"
}
```

응답 예시 (200)
```json
{
  "date": "2026-03-02",
  "missionId": "breath-3",
  "completedAt": "2026-03-02T08:30:00.000Z",
  "updated": true,
  "requestId": "req_9fda"
}
```

상태 코드
- `200 OK`: 생성/갱신 성공 (idempotent)
- `400 Bad Request`: 필수 필드 누락/형식 오류
- `401 Unauthorized`: 로그인 모드에서 토큰 오류
- `409 Conflict`: 동일 날짜에 상이한 `missionId` 충돌
- `422 Unprocessable Entity`: 지원하지 않는 `schemaVersion`
- `500 Internal Server Error`: 서버 오류

### 3) 히스토리 조회
- `GET /history?from=YYYY-MM-DD&to=YYYY-MM-DD`
- 설명: 기간 내 완료 기록과 요약 반환

요청 예시
```http
GET /api/v1/history?from=2026-02-02&to=2026-03-02
X-Anon-Id: 75ac5f95-4fcb-4f3f-83f7-3c67f0c4b4a8
```

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

상태 코드
- `200 OK`: 정상 조회
- `400 Bad Request`: `from/to` 형식 오류 또는 범위 오류
- `401 Unauthorized`: 로그인 모드에서 토큰 오류
- `500 Internal Server Error`: 서버 오류

## 공통 에러 포맷
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "date must be YYYY-MM-DD",
    "details": {
      "field": "date"
    }
  },
  "requestId": "req_9fda"
}
```

## 표준 에러 코드
- `VALIDATION_ERROR`: 입력값 검증 실패
- `UNAUTHORIZED`: 인증 실패
- `MISSION_CONFLICT`: 동일 날짜 `missionId` 충돌
- `UNSUPPORTED_SCHEMA_VERSION`: 지원하지 않는 payload 버전
- `INTERNAL_ERROR`: 처리 중 예외

## 전환 단계 연계
- Phase A: Local-only (`localStorage` read/write)
- Phase B: Import-only (로컬 기록 서버 적재)
- Phase C: Dual-write (로컬+서버 동시 쓰기)
- Phase D: Server-only (서버 단일 read/write)
