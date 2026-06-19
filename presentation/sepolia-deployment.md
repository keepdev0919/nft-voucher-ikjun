# Sepolia 테스트넷 배포 정보

발표 자료용 참조. 2026-06-17 배포.

## 컨트랙트 주소

```
0x002E36f608C284C3f57308704b3ae99Fb1839bc7
```

## 네트워크

- 체인: **Sepolia Testnet** (Ethereum 공식 테스트넷)
- Chain ID: `11155111`

## 배포자 (Contract Creator)

```
0x3F325E93...3f73c2771   (Account 1)
```

(Ganache deterministic 주소가 아닌 새 랜덤 계정 — sweep 봇 회피)

## 공개 탐색기 링크

| 탐색기 | 링크 |
|--------|------|
| **Sepolia Etherscan** | https://sepolia.etherscan.io/address/0x002E36f608C284C3f57308704b3ae99Fb1839bc7 |
| **Sourcify (verified)** | https://repo.sourcify.dev/contracts/full_match/11155111/0x002E36f608C284C3f57308704b3ae99Fb1839bc7/ |
| **Blockscout (verified)** | https://eth-sepolia.blockscout.com/address/0x002E36f608C284C3f57308704b3ae99Fb1839bc7 |

## Verification 상태

- ✅ **Sourcify Verification Successful** — 소스 코드 공개 검증
- ✅ **Blockscout Verification Successful** — 소스 코드 공개 검증
- ⚠️ Etherscan verification skipped — Etherscan API key 미설정 (선택 사항, 발표에 영향 없음)

## 발표 답변 템플릿

> "본 시스템의 스마트 컨트랙트는 Sepolia 공개 테스트넷에 배포되어,
> 누구나 Etherscan/Sourcify/Blockscout에서 트랜잭션, 이벤트 로그,
> 컨트랙트 소스 코드를 직접 검증할 수 있습니다.
>
> 컨트랙트 주소: `0x002E36f608C284C3f57308704b3ae99Fb1839bc7`
> Sourcify·Blockscout 양쪽에서 소스 verified 완료."

## 발표 슬라이드 추가 항목

- 슬라이드 4 (시스템 아키텍처) 또는 새 슬라이드: "Sepolia 배포 + 공개 verification"
- 또는 슬라이드 9 (DEMO) 옆에 한 줄: "공개 테스트넷 배포: Sepolia"
- QR 코드로 Etherscan 링크 첨부하면 시청자가 즉시 검증 가능

## 캡쳐

`captures/sepolia-etherscan.png` — Etherscan 컨트랙트 페이지 캡쳐
