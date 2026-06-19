# NFT Voucher 최종 발표 — Design System (Light Tone)

> 2026.06.18 졸업프로젝트 최종 발표 슬라이드 디자인 가이드.
> **라이트 톤 — 학술 제안서 PDF 양식 그대로**.
> 흰 배경 + 좌측 파란 세로 라인 + 둥근 카드 + 파란/빨강 강조.
> 1920×1080 고정. Chrome PDF 변환 = 한 슬라이드 = 한 페이지.

---

## 0. 톤 전환 배경

기존 다크 톤 버전이 "너무 어둡고 무거워서 청자가 안 들어온다"는 피드백을 받았다.
참고 PDF (`블록체인_기반_NFT_바우처_시스템_제안.pdf`)의 흰 배경 + 파란 강조 + 둥근 카드 양식을 그대로 따라 라이트 톤으로 풀 리뉴얼.

**유지**: 콘텐츠 / 슬라이드 13장 구성 / Phase 1·2 구분 / 4상태 컬러 매핑.
**교체**: 컬러 시스템 전반 / 카드 스타일 / 헤더 패턴 (파란 세로 라인 추가) / 표지 그라데이션.

---

## 1. 디자인 원칙 — 라이트 톤

1. **흰 배경 + 파란 단색 강조** — 모든 본문 슬라이드는 흰 배경. 파란(#3B82F6)은 핵심 키워드, 액센트 라인, 카드 헤더 도트에만.
2. **좌측 파란 세로 라인 헤더** — 본문 슬라이드 모두 헤더에 4px 파란 세로 라인 + 검정 굵은 큰 제목. PDF 본문 페이지(2~5)의 시그니처 패턴.
3. **둥근 카드** — radius 16~20px. 흰 배경 + 옅은 보더 + 미세 그림자 (다크처럼 글로우 X).
4. **숫자는 파란 동그라미** — `01`, `02` 같은 카드 번호는 **파란 원형 배경 + 흰 숫자**. 이모지 절대 X.
5. **부정 강조는 빨강** — "신뢰도 결여" / "부정 사용" / "MISMATCH" 같은 부정적 키워드만 빨강(#ef4444). 남발 금지.
6. **표지만 톤이 다름** — 표지 슬라이드는 진한 파란 그라데이션 배경 + 흰 큰 타이틀. PDF 표지 페이지를 그대로 모방.
7. **인쇄 안전 색상** — 너무 옅은 색은 프린트에서 사라짐. 보더 최소 #e2e8f0, 텍스트 회색 최소 #475569.

---

## 2. 컬러 팔레트 (Light)

```css
/* base */
--bg:            #ffffff;            /* 메인 배경 — 본문 흰색 */
--surface:       #f7f8fc;            /* 살짝 푸른 그레이 (섹션 구분/카드 배경 옵션) */
--surface-hi:    #eef1f7;            /* 카드 위 카드 */

/* text */
--text:          #0f172a;            /* 진한 검정/네이비 — 본문 강조 */
--text-dim:      #475569;            /* 회색 — 본문 일반 */
--text-mute:     #94a3b8;            /* 라벨·페이지번호·메타 */

/* border */
--border:        #e2e8f0;            /* 카드 보더 기본 */
--border-strong: #cbd5e1;            /* 강조 보더 */

/* accent — Blue */
--accent:        #3B82F6;            /* 파란 강조 */
--accent-dark:   #1E40AF;            /* 표지 그라데이션 어두운 쪽 */
--accent-soft:   #dbeafe;            /* 파란 배경 / 배지 */
--accent-line:   #93c5fd;            /* 파란 보더 */

/* state */
--success:       #10b981;            /* VERIFIED */
--success-soft:  #d1fae5;
--success-line:  #6ee7b7;
--warning:       #f59e0b;            /* MISSING_DB / MISSING_ONCHAIN / Phase 2 */
--warning-soft:  #fef3c7;
--warning-line:  #fcd34d;
--danger:        #ef4444;            /* MISMATCH / 부정 강조 */
--danger-soft:   #fee2e2;
--danger-line:   #fca5a5;

/* shadow */
--shadow-card:   0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04);
--shadow-strong: 0 2px 6px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.08);
```

**Phase 매핑**
- Phase 1 (구현 완료) → `--accent` 블루
- Phase 2 (설계 + 부분 구현) → `--warning` 옐로

**4상태 매핑**
- VERIFIED → `--success`
- MISMATCH → `--danger`
- MISSING_DB → `--warning`
- MISSING_ONCHAIN → `--warning`

---

## 3. 타이포

**폰트**
- 한글: `Pretendard Variable` (CDN)
- 영문: `Inter` 시스템 폴백
- 모노: `JetBrains Mono` (CDN)

**스케일**: 12 / 14 / 18 / 22 / 28 / 36 / 48 / 72 / 100 / 144 px

**굵기 대비 강함**
- 본문: 400~500
- 강조: 700~800
- letter-spacing: 헤드 `-0.02em` 타이트, 라벨은 `0.2em~0.3em` 와이드

---

## 4. 컴포넌트 카탈로그

### .slide-header (본문 슬라이드 공통)
- 좌측: `.title-rail` (4px width × 56px height 파란 세로 라인) + `.section-title` (검정 굵은 48px)
- 우측: 페이지 번호 모노 14px

### .card (라이트 톤)
- 흰 배경 + `1px solid var(--border)` + `border-radius: 18px` + `--shadow-card`
- 패딩 36~40px

### .card-num (파란 동그라미 숫자)
- 36px width/height circle + `--accent` 배경 + 흰 숫자 18px / 700
- 카드 좌상단에 위치

### .badge (Phase / 상태)
- `--accent-soft` 배경 + `--accent` 텍스트 + 14px / 600 / pill shape
- `.badge.warning`, `.badge.success`, `.badge.danger` 변형

### .code-inline / .code-block
- `.code-inline`: monospace + `--surface` 배경 + `--border` 보더 + 4px radius
- `.code-block`: monospace + 카드 내부 + 1.6 line-height

### .impact-quote (강조 인용 박스)
- 좌측 4px `--accent` 보더 + `--accent-soft` 배경 + 검정 22px 굵게

### .danger-em (부정 강조 텍스트)
- `--danger` 색상 + 700 weight
- "신뢰도 결여", "부정 사용" 같은 부정 키워드용

---

## 5. 레이아웃 패턴 (슬라이드별)

| # | 슬라이드 | 패턴 | 핵심 |
|---|---------|------|------|
| 01 | 표지 | **Blue Gradient Cover** | 진한 파란 배경 + 흰 큰 타이틀 + 우측 미세 곡선 SVG |
| 02 | 기존 바우처 문제점 | **PDF Page-2 Replica** | 좌 카드 2장 (01/02 파란 번호) + 우 정보 비대칭 SVG + 뉴스 캡쳐 |
| 03 | 블록체인 활용 6가지 | **Card Grid 3×2** | 파란 번호 카드 6장 |
| 04 | 4-Layer 아키텍처 | **Vertical Stack** | L1~L3 파란 배지 / L4 노란 배지 |
| 05 | 구현 범위 3 Stack | **Card Grid 3×1** | FE/BE/Contract 카드 + 코드 박스 |
| 06 | 보안 모델 | **Two-Column** | 행정 함수 vs 결제 함수 |
| 07 | Phase 2 검증 + 4상태 | **Captures Grid 4×1** | 4상태 chip + 캡쳐 4장 |
| 08 | Sepolia 배포 | **Big Code + Capture** | 큰 컨트랙트 주소 + Etherscan 캡쳐 |
| 09 | 팀원 역할 | **Card Grid 4×1** | 4명 가로 카드 (파란 번호) |
| 10 | 시연 영상 | **Centered Demo** | 큰 DEMO + 16:9 영상 placeholder |
| A1 | Q&A — ERC-721 확장 | **3 Card Compare** | ERC-20 / 721 / 우리 선택 |
| A2 | Q&A — 백엔드 우회 | **2 Card Compare** | 현재 / Phase 2 |
| A3 | Q&A — QR 도용 | **2 Col Split** | QR JSON + 4중 방어 |

---

## 6. 그리드 / 스페이싱

스페이싱 스케일: `8 / 16 / 24 / 32 / 48 / 64 / 96 / 120`

- 슬라이드 내부 패딩: `88px 120px`
- 헤더 → 컨텐츠 간격: `48~56px`
- 카드 내부 패딩: `32~40px`
- 카드 간 gap: `20~28px`

---

## 7. 디테일 디시전

### 표지 슬라이드 (다른 슬라이드와 톤 완전 분리)
- 배경: `linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)`
- 좌상단: "PRESENTATION" 작은 흰 라벨 (letter-spacing 0.4em)
- 메인: 흰 큰 한글 타이틀 100~120px / 800
- 우측 장식: SVG로 흰 곡선 라인 1~2개 (opacity 0.15)

### 본문 헤더 시그니처 (PDF 양식 그대로)
모든 본문 슬라이드 헤더 = **4px 파란 세로 라인 + 검정 48px 굵은 제목**.
세로 라인 height는 제목 height에 맞춤 (대략 56~64px).

### 카드 번호 도트
01, 02, 03 같은 카드 번호 = **파란 원형 (40px) + 흰 숫자**. 절대 이모지 X.

### 정보 비대칭 SVG (슬라이드 2 핵심)
- 상단 중앙: "발행 기관" 파란 박스
- 좌하: "사용자" 회색 박스
- 우하: "가맹점" 회색 박스
- 가운데: 흐릿한 큰 원 + "정보 비대칭" 텍스트
- 점선 연결 3개: 발행기관↔사용자(빨강 "부정유통 발생"), 발행기관↔가맹점(노랑 "데이터 불일치"), 사용자↔가맹점(회색)
- 하단 범례: 빨강 도트 부정 사용 경로 · 노랑 도트 신뢰 균열 · 파랑 도트 관리 시스템

### 페이지 번호
우하단 `01 / 10`. 모노 14px. `--text-mute` 색상.

### 그림자
- 카드: `--shadow-card` (옅게)
- 강조 카드: `--shadow-strong` (조금 강하게)
- **글로우 절대 X** — 다크 톤 잔재이므로 라이트에선 금지

### 호버 / 트랜지션 — 없음
인쇄 / PDF 출력이 목적이므로 제거.

---

## 8. 화면 반응형 줌

```css
@media screen and (max-width: 1920px) {
  body {
    transform: scale(calc(100vw / 1920));
    transform-origin: top left;
  }
}
```

기존 `zoom: 0.5` 대신 `transform: scale()` 사용 — Safari/Chrome 모두 안정적.
PDF 변환 (`@media print`)에는 영향 없음.

---

## 9. 출력 / 프린트

```css
@page { size: 1920px 1080px landscape; margin: 0; }

.slide {
  width: 1920px;
  height: 1080px;
  page-break-after: always;
  break-after: page;
}
```

**PDF 변환**: Chrome `Cmd+P` → 대상 "PDF로 저장" → 용지 크기 "맞춤" 1920×1080 → 여백 "없음" → 배경 그래픽 ON.

---

## 10. 콘텐츠 정확성 체크리스트

- [x] Phase 1 = 구현 완료 / Phase 2 = 설계 완료 + 검증 UI 부분 구현
- [x] 컨트랙트 주소: `0x002E36f608C284C3f57308704b3ae99Fb1839bc7`
- [x] 체인: Sepolia Testnet (Chain ID 11155111)
- [x] Sourcify Verified / Blockscout Verified / Etherscan은 미설정 (skip)
- [x] 함수명: `useVoucherByMerchant`, `approveMerchant`, `createVoucherProgram`, `mintVoucher`
- [x] 상태 변수: `voucherValue[tokenId]`, `recordCommitmentHash` (= metadataHash)
- [x] 이벤트: `VoucherUsed`, `VoucherMinted`, `VoucherProgramCreated`, `MerchantApproved`
- [x] 4상태: VERIFIED / MISMATCH / MISSING_DB / MISSING_ONCHAIN
- [x] 팀원: 조익준(FE) / 정재현(BE) / 조 현(Solidity) / 황종훈(Blockchain)
- [x] 발표일: 2026.06.18
- [x] **톤**: Light (흰 배경 + 파란 강조 + PDF 양식 그대로)
