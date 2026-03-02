# 08. Design Tokens

## 목적
- 카피 중심 UI에 맞춰 읽기 쉬운 리듬을 만든다.
- 과한 장식보다 안정적인 여백, 대비, 움직임을 우선한다.

## 1) Typography

### Font Family
| Token | Value | Usage |
| --- | --- | --- |
| `--font-family-base` | `"Pretendard", "Noto Sans KR", sans-serif` | 본문/버튼/라벨 |
| `--font-family-heading` | `"Pretendard", "Noto Sans KR", sans-serif` | 제목 |

### Font Size
| Token | Value | Usage |
| --- | --- | --- |
| `--font-size-12` | `0.75rem` (12px) | 캡션, 상태 라벨 |
| `--font-size-14` | `0.875rem` (14px) | 보조 텍스트 |
| `--font-size-16` | `1rem` (16px) | 기본 본문 |
| `--font-size-18` | `1.125rem` (18px) | 카드 제목 |
| `--font-size-24` | `1.5rem` (24px) | 페이지 제목(H1) |
| `--font-size-32` | `2rem` (32px) | 랜딩 강조 타이틀 |

### Line Height / Weight
| Token | Value | Usage |
| --- | --- | --- |
| `--line-height-tight` | `1.3` | 제목 |
| `--line-height-base` | `1.5` | 본문 |
| `--line-height-relaxed` | `1.6` | 긴 설명 |
| `--font-weight-regular` | `400` | 본문 |
| `--font-weight-medium` | `500` | 버튼/보조 제목 |
| `--font-weight-semibold` | `600` | 주요 제목 |

## 2) Spacing
| Token | Value | Usage |
| --- | --- | --- |
| `--space-4` | `0.25rem` (4px) | 배지 내부 |
| `--space-8` | `0.5rem` (8px) | 라벨 간격 |
| `--space-12` | `0.75rem` (12px) | 카드 내부 소간격 |
| `--space-16` | `1rem` (16px) | 기본 컴포넌트 간격 |
| `--space-20` | `1.25rem` (20px) | 섹션 내부 |
| `--space-24` | `1.5rem` (24px) | 섹션 간격 |
| `--space-32` | `2rem` (32px) | 페이지 블록 간격 |
| `--space-40` | `2.5rem` (40px) | 랜딩 상단 여백 |

## 3) Radius
| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | `8px` | 칩, 배지 |
| `--radius-md` | `12px` | 버튼 |
| `--radius-lg` | `16px` | 카드 |
| `--radius-xl` | `24px` | 히어로 카드/패널 |
| `--radius-pill` | `999px` | 원형/알약 버튼 |

## 4) Shadow
| Token | Value | Usage |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.06)` | 기본 카드 |
| `--shadow-sm` | `0 4px 10px rgba(15, 23, 42, 0.08)` | 떠 있는 카드 |
| `--shadow-md` | `0 10px 24px rgba(15, 23, 42, 0.12)` | 모달/강조 패널 |

## 5) Motion

### Duration / Easing
| Token | Value | Usage |
| --- | --- | --- |
| `--motion-fast` | `120ms` | hover/focus |
| `--motion-base` | `180ms` | 버튼/카드 전환 |
| `--motion-slow` | `260ms` | 섹션 등장 |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 기본 전환 |
| `--ease-soft` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 부드러운 진입 |

### Motion Guardrails (과한 움직임 금지)
- 자동 재생 애니메이션은 `opacity`/`transform`만 사용한다.
- 반복 애니메이션은 호흡 타이머 등 기능적 요소에 한해 사용한다.
- 이동 거리는 최대 `8px`, 확대/축소는 `0.96 ~ 1.02` 범위로 제한한다.
- `prefers-reduced-motion: reduce`에서는 애니메이션 시간을 `0ms`로 축소한다.

### Breathing Animation Tokens
| Token | Value | Usage |
| --- | --- | --- |
| `--breath-cycle-default` | `4000ms` | 기본 호흡 1사이클 |
| `--breath-cycle-burnout` | `6000ms` | 번아웃 저강도 1사이클 |
| `--breath-scale-min` | `0.98` | 호흡 원형 최소 스케일 |
| `--breath-scale-max` | `1.02` | 호흡 원형 최대 스케일 |
| `--breath-idle-opacity` | `0.88` | 대기 상태 |
| `--breath-active-opacity` | `1` | 활성 상태 |
| `--breath-pause-gap` | `400ms` | 사이클 간 정지 시간 |

### Breathing Motion Rules
- 숨쉬기 애니메이션은 `scale` + `opacity` 조합만 허용한다.
- 번아웃 모드에서는 `--breath-cycle-burnout`을 사용하고 스케일 변화폭을 `1.00 ~ 1.02`로 축소한다.
- 호흡 애니메이션과 배경 장식 애니메이션을 동시에 반복 재생하지 않는다.
- 화면 비활성(탭 전환, 백그라운드) 시 애니메이션을 일시정지한다.
