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
- 라우팅
- `src/pages/index.vue` -> 랜딩
- `src/pages/today.vue` -> 오늘의 미션
- `src/pages/history.vue` -> 기록
- UI 컴포넌트
- `src/components/BreathingTimer.vue`
- `src/components/MissionCard.vue`
- `src/components/HistoryList.vue`
- 상태/로직
- `src/composables/useHealingStore.ts`
- `src/utils/mission.ts`
- `src/utils/healing-state.ts`
- 타입
- `src/types/healing.ts`
