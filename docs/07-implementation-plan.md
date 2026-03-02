# 07. Implementation Plan

## 체크리스트
- [x] Nuxt 프로젝트 생성 (`npm create nuxt@latest .`)
- [x] TypeScript + ESLint 모듈 구성
- [x] `srcDir='src/'` 구조 정리
- [x] docs 9종 작성
- [x] localStorage 기반 상태 로직 구현 (새로고침 유지 + 탭 간 동기화)
- [x] `/`, `/today`, `/history` 페이지 구현
- [x] 기본 레이아웃/내비게이션 구현
- [x] 모바일 우선 스타일 및 접근성 기본 반영 (`progressbar`, `role="status"`, `aria-labelledby`, 44px 터치 타깃)
- [x] Vitest 설정 및 샘플 테스트 작성
- [x] README, editorconfig 정리
- [x] lint/test/dev 최종 검증

## 파일/컴포넌트 매핑
- 라우팅/페이지
- `src/pages/index.vue` -> 랜딩(`/`) + 60초 호흡 카드 + `/today` CTA
- `src/pages/today.vue` -> 오늘의 미션(`/today`) + 완료 액션 + dev reset 버튼
- `src/pages/history.vue` -> 기록(`/history`) + 최근 30일 목록
- 레이아웃/앱 셸
- `src/layouts/default.vue` -> 상단 브랜드/네비게이션(홈/오늘/기록) + skip link
- `src/app.vue` -> `NuxtLayout`/`NuxtPage`/`NuxtRouteAnnouncer` 연결
- UI 컴포넌트
- `src/components/BreathingTimer.vue` -> 원형 진행 표시, 시작/다시, `progressbar`
- `src/components/MissionCard.vue` -> 미션 상세/완료 버튼/칭찬 메시지(`role="status"`)
- `src/components/HistoryList.vue` -> 날짜별 완료/미완료 배지와 미션명
- 상태/스토리지
- `src/composables/useHealingStore.ts` -> localStorage hydrate/persist, 탭 간 `storage` 동기화
- `src/utils/healing-state.ts` -> 스키마 normalize, 일자 중복 완료 방지, 히스토리 생성
- `src/utils/mission.ts` -> 날짜 기반 deterministic 미션 선택
- 타입/스타일
- `src/types/healing.ts` -> Mission/HealingState/HistoryDay 타입
- `src/assets/css/main.css` -> 모바일 우선 스타일, 44px 터치 타깃, reduced-motion 대응
