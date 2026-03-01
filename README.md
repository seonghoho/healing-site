# healing-site

번아웃 회복을 위한 Nuxt 기반 MVP 서비스입니다. 랜딩의 60초 호흡에서 시작해, 오늘의 미션 1개를 완료하고 최근 기록을 확인할 수 있습니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

기본 개발 서버: `http://localhost:3000`

## 스크립트

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run format
npm run test
npm run test:watch
```

## 라우트 목록

- `/` : 랜딩(60초 호흡 + 시작하기)
- `/today` : 오늘의 미션 1개 + 완료 체크 + 칭찬 메시지
- `/history` : 최근 30일 기록

## docs 읽는 순서

1. `docs/00-vision.md`
2. `docs/01-prd.md`
3. `docs/02-user-flows.md`
4. `docs/03-ia-sitemap.md`
5. `docs/04-copy-tone.md`
6. `docs/05-ui-spec.md`
7. `docs/06-data-model.md`
8. `docs/07-implementation-plan.md`
9. `docs/decisions.md`

## MVP 다음 단계 (To-do)

- 서버 저장소 연동(회원/비회원 선택)
- 7일/30일 뷰 토글 및 주간 인사이트
- 미션 개인화(시간대/기분 기반)
- 접근성 고도화(스크린리더 문맥 검수)
- E2E 테스트(PW) 추가
