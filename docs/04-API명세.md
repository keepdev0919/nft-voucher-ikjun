# API 명세

> 팀 백엔드(`team-backend/`) 최신 구현 기준 (2026-05 commit `0aa1686`).
> 프론트엔드(`nft-voucher-ikjun/frontend/`)는 이 문서의 시그니처에만 의존한다.

## 기본 정보

- **Base URL**: `http://localhost:8080`
- **모든 엔드포인트 prefix**: `/api/...`
- **응답 형식**: 모든 응답은 `ApiResponse<T>`로 래핑된다.

### 공통 응답 래퍼 — `ApiResponse<T>`

```ts
interface ApiResponse<T> {
  success: boolean;     // true: 성공, false: 비즈니스/인증 오류
  data: T | null;       // 성공 시 페이로드, 실패 시 null
  code: string | null;  // 실패 시 ErrorCode (예: "VOUCHER_NOT_FOUND", "WALLET_MISMATCH")
  message: string | null;
}
```

> 성공 응답은 `{ success: true, data: ... }`만 채워지고 `code`/`message`는 `null`이다.
> 실패 응답은 `{ success: false, code, message }`만 채워지고 `data`는 `null`이다.

### 인증 헤더

JWT가 필요한 엔드포인트는 다음 헤더를 포함해야 한다:

```
Authorization: Bearer <JWT_TOKEN>
```

JWT의 `subject`는 지갑 주소, `role` 클레임은 `USER` / `MERCHANT` / `ADMIN` 중 하나다 (`JwtUtil.java:25-33`).

### 권한 매트릭스 요약 (`SecurityConfig.java:27-36`)

| 경로 | 인증 | 비고 |
|------|------|------|
| `POST /api/auth/**` | ❌ permitAll | nonce 발급 / verify |
| `POST /api/members/user` | ❌ permitAll | 회원가입 |
| `POST /api/members/merchant` | ❌ permitAll | 회원가입 |
| `GET /api/members/check/**` | ❌ permitAll | 로그인 분기용 |
| `GET /api/metadata/**` | ❌ permitAll | ERC-721 tokenURI 응답 |
| `GET /swagger-ui/**`, `/v3/api-docs/**` | ❌ permitAll | 개발용 |
| `GET /api/members/{walletAddress}` | ✅ | 회원 정보 |
| `**` (나머지 전체) | ✅ | JWT 필요 |

---

## 1. Auth — MetaMask 서명 로그인

### 1.1 Nonce 발급

```
GET /api/auth/nonce/{walletAddress}
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |

**Path Parameters**

| 이름 | 타입 | 설명 |
|------|------|------|
| `walletAddress` | `string` | 0x 포함 42자 이더리움 주소 (이미 회원가입 된 주소여야 함) |

**Response**

```ts
ApiResponse<string>   // data: nonce (UUID v4)
```

**Example**

```bash
curl http://localhost:8080/api/auth/nonce/0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
# {"success":true,"data":"550e8400-e29b-41d4-a716-446655440000","code":null,"message":null}
```

프론트는 받은 nonce를 다음 메시지에 포함시켜 `personal_sign`으로 서명한다 (`AuthService.java:55-57`):

```
Voucher 서비스 로그인
Nonce: <nonce>
```

---

### 1.2 서명 검증 및 JWT 발급

```
POST /api/auth/verify
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |

**Request Body**

```ts
interface VerifyRequest {
  walletAddress: string;  // 0x 포함 42자
  signature: string;      // personal_sign 결과 (0x + 130 hex)
}
```

**Response**

```ts
ApiResponse<string>   // data: JWT (HS256, jjwt 0.12.3)
```

검증 성공 시 서버는 nonce를 즉시 폐기한다 (재사용 방지, `AuthService.java:49`).

**Example**

```bash
curl -X POST http://localhost:8080/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "signature": "0xabcd...130hex"
  }'
# {"success":true,"data":"eyJhbGciOiJIUzI1NiJ9...","code":null,"message":null}
```

**주요 에러 코드**

| code | 의미 |
|------|------|
| `MEMBER_NOT_FOUND` | 등록되지 않은 지갑 주소 |
| `INVALID_SIGNATURE` | 서명 복원 결과가 walletAddress와 불일치 |

---

## 2. Member — 회원 관리

### 2.1 일반 회원 가입

```
POST /api/members/user
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |
| Status | 201 Created |

**Request Body**

```ts
interface CreateUserRequest {
  walletAddress: string;  // 0x[0-9a-fA-F]{40}
  nickname: string;       // 1~50자
}
```

**Response**: `ApiResponse<MemberResponse>` (아래 2.5 참고)

**Example**

```bash
curl -X POST http://localhost:8080/api/members/user \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1","nickname":"홍길동"}'
```

---

### 2.2 가맹점 회원 가입

```
POST /api/members/merchant
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |
| Status | 201 Created |

**Request Body**

```ts
interface CreateMerchantRequest {
  walletAddress: string;  // 0x[0-9a-fA-F]{40}
  nickname: string;       // 1~50자
  category: string;       // 필수 — 예: "일반 음식점", "영화관"
}
```

> 회원가입 시점에는 온체인 승인이 안 된 상태다. ADMIN이 `/api/members/merchant/{walletAddress}/approve`를
> 호출해야 컨트랙트의 `approvedMerchant[merchant] = true`가 설정되어 결제가 가능해진다.

---

### 2.3 가맹점 온체인 승인/취소 [ADMIN]

```
POST /api/members/merchant/{walletAddress}/approve?approved={true|false}
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | ADMIN |

JWT subject(인증된 지갑)의 role이 ADMIN이 아니면 `NOT_ADMIN` 반환. 내부적으로 컨트랙트
`approveMerchant(address, bool)` (`Voucher.sol:131-135`) 호출.

**Path / Query**

| 이름 | 위치 | 설명 |
|------|------|------|
| `walletAddress` | path | 승인 대상 가맹점 지갑 |
| `approved` | query | `true` 승인, `false` 취소 |

**Response**: `ApiResponse<MemberResponse>`

**Example**

```bash
curl -X POST "http://localhost:8080/api/members/merchant/0xabc.../approve?approved=true" \
  -H "Authorization: Bearer $ADMIN_JWT"
```

---

### 2.4 지갑 주소 존재 여부 확인

```
GET /api/members/check/{walletAddress}
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |

로그인 분기에 사용한다. `data: true` → 기존 회원 (로그인 흐름), `data: false` → 회원가입 화면.

**Response**

```ts
ApiResponse<boolean>
```

**Example**

```bash
curl http://localhost:8080/api/members/check/0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
# {"success":true,"data":true,"code":null,"message":null}
```

---

### 2.5 회원 정보 조회

```
GET /api/members/{walletAddress}
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | any |

**Response**

```ts
interface MemberResponse {
  id: number;
  walletAddress: string;
  nickname: string;
  role: "USER" | "MERCHANT" | "ADMIN";
  category: string | null;  // MERCHANT만 사용
  createdAt: string;        // ISO-8601
}
```

**Example**

```bash
curl http://localhost:8080/api/members/0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 \
  -H "Authorization: Bearer $JWT"
```

---

## 3. Voucher Program — 바우처 프로그램

### 3.1 프로그램 생성 [ADMIN]

```
POST /api/voucher-programs
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | ADMIN |
| Status | 201 Created |

JWT 지갑과 `walletAddress` 필드가 일치해야 한다 (`VoucherProgramController.java:36-39`). 일치하지 않으면 `WALLET_MISMATCH`.

**Request Body**

```ts
interface CreateVoucherProgramRequest {
  walletAddress: string;     // 요청자 지갑 (= JWT subject)
  name: string;
  description?: string;
  maxValue: number;          // > 0 (바우처 액면가, 단위: 원)
  totalSupply: number;       // > 0 (총 발행 수량)
  category: string;
  validFrom: string;         // ISO-8601 LocalDateTime
  validUntil: string;        // ISO-8601 LocalDateTime
}
```

**Response**

```ts
interface VoucherProgramResponse {
  id: number;
  createdById: number;
  createdByWallet: string;
  name: string;
  description: string | null;
  maxValue: number;
  totalSupply: number;
  category: string;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}
```

**Example**

```bash
curl -X POST http://localhost:8080/api/voucher-programs \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xAdmin...",
    "name": "2026 청년 식비 지원",
    "description": "만 19~34세 대상",
    "maxValue": 50000,
    "totalSupply": 1000,
    "category": "일반 음식점",
    "validFrom": "2026-05-01T00:00:00",
    "validUntil": "2026-12-31T23:59:59"
  }'
```

---

### 3.2 활성 프로그램 목록

```
GET /api/voucher-programs
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | any |

`status = ACTIVE`인 프로그램만 반환.

**Response**: `ApiResponse<VoucherProgramResponse[]>`

---

### 3.3 프로그램 단건 조회

```
GET /api/voucher-programs/{id}
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | any |

**Response**: `ApiResponse<VoucherProgramResponse>`

---

## 4. Voucher — 바우처 발급 / 조회 / 사용

> 사용 흐름의 핵심: 모든 결제는 **EIP-712 메타 트랜잭션**으로 처리된다.
> 백엔드가 가스를 대납하고 `useVoucherByMerchant`를 호출한다.
> 자세한 보안 설계는 `07-QR검증-보안설계.md`.

### 4.1 바우처 발급 (민팅)

```
POST /api/vouchers
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (JWT 지갑 == request.walletAddress) |
| Status | 201 Created |

DB에 PENDING 저장 → 컨트랙트 `mintVoucher` 전송 → 1초 간격 최대 40초 Receipt 폴링 →
`Transfer` 이벤트의 `topics[3]`에서 `tokenId` 추출 → DB ACTIVE 갱신.
각 단계는 독립 트랜잭션으로 커밋되어 타임아웃 시에도 `txHash` 보존됨 (`VoucherService.java:67-108`).

**Request Body**

```ts
interface CreateVoucherRequest {
  voucherProgramId: number;
  walletAddress: string;   // 바우처 수령자 (= JWT subject)
}
```

**Response**

```ts
interface VoucherResponse {
  id: number;                // DB ID
  onChainTokenId: number;    // 컨트랙트 tokenId
  voucherProgramId: number;
  programName: string;
  ownerId: number;
  ownerWallet: string;
  currentValue: number;      // 현재 잔액
  initialValue: number;      // 발급 시 액면가
  tokenUri: string;          // 백엔드 metadata 엔드포인트 URL
  txHash: string;
  blockNumber: number;
  status: "PENDING" | "ACTIVE" | "USED" | "EXPIRED";
  mintedAt: string;
  createdAt: string;
}
```

**Example**

```bash
curl -X POST http://localhost:8080/api/vouchers \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"voucherProgramId":1,"walletAddress":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"}'
```

**주요 에러 코드**

| code | 의미 |
|------|------|
| `WALLET_MISMATCH` | JWT subject ≠ request.walletAddress |
| `VOUCHER_PROGRAM_INACTIVE` | 프로그램이 ACTIVE 상태가 아님 |
| `MINT_FAILED` | 트랜잭션 전송 실패 |
| `MINT_TIMEOUT` | Receipt 40초 안에 도착 안 함 (txHash는 보존됨) |

---

### 4.2 내 바우처 목록

```
GET /api/vouchers/my/{walletAddress}
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (JWT 지갑 == path.walletAddress) |

**Response**: `ApiResponse<VoucherResponse[]>`

---

### 4.3 바우처 상세 조회

```
GET /api/vouchers/{id}?walletAddress={ownerWallet}
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (소유자 본인) |

JWT 지갑과 `walletAddress` 쿼리가 다르거나, `walletAddress`가 실제 소유자가 아니면 `VOUCHER_ACCESS_DENIED` (403).

**Response**: `ApiResponse<VoucherResponse>`

---

### 4.4 바우처 QR 데이터 조회

```
GET /api/vouchers/{id}/qr
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (소유자) |

> ⚠️ **QR 방향 변경 예정** — 현재 백엔드는 "사용자 QR → 가맹점 스캔" 흐름이지만,
> 교수님 권유에 따라 "가맹점 QR → 사용자 스캔"으로 전환 예정 (`07-QR검증-보안설계.md` 참고).
> 이 엔드포인트는 전환 시 deprecated 처리된다.

**Response**

```ts
interface VoucherQrResponse {
  voucherId: number;
  ownerWallet: string;
  onChainTokenId: number;
  currentValue: number;
  programName: string;
}
```

**주요 에러 코드**

| code | 의미 |
|------|------|
| `VOUCHER_ACCESS_DENIED` | JWT 지갑이 소유자가 아님 |
| `VOUCHER_NOT_ACTIVE` | ACTIVE 상태가 아닌 바우처 |

---

### 4.5 대기 중인 결제 요청 목록

```
GET /api/vouchers/pending-use
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER |

가맹점이 `MerchantController.prepareUse`로 만든 PENDING 이력 중 JWT 지갑이 소유자인 것만 반환.
**전환된 QR 방향(가맹점 QR → 사용자 스캔)의 메인 진입점**: 사용자가 가맹점 QR을 스캔한 뒤
이 목록에서 자신이 서명해야 할 결제 요청을 확인한다.

**Response**

```ts
interface UseVoucherPrepareResponse {
  historyId: number;
  metadataHash: string;     // 0x + 64 hex (keccak256 of canonical JSON)
  nonce: string;            // BigInteger as string
  deadline: number;         // UNIX seconds
  eip712: {                 // MetaMask eth_signTypedData_v4 입력
    domain: {
      name: "Voucher";
      version: "1";
      chainId: number;
      verifyingContract: string;
    };
    types: {
      UseVoucher: { name: string; type: string }[];
    };
    primaryType: "UseVoucher";
    message: {
      tokenId: string;
      user: string;          // 바우처 소유자
      merchant: string;      // ⚠️ 백엔드 지갑 (실제 가맹점 아님 — 아래 4.6 참고)
      amount: string;
      recordCommitmentHash: string;
      nonce: string;
      deadline: string;
    };
  };
}
```

응답은 `ApiResponse<UseVoucherPrepareResponse[]>`.

---

### 4.6 바우처 사용 준비 (사용자 주도)

```
POST /api/vouchers/{id}/use/prepare
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (소유자) |

`MerchantController`의 prepare와 동일하지만 사용자가 직접 가맹점 지갑을 지정하는 경로다.

**Request Body**

```ts
interface UseVoucherPrepareRequest {
  merchantWallet: string;   // 실제 가맹점 지갑 (off-chain canonical JSON에 기록됨)
  amount: number;           // > 0
}
```

**Response**: `ApiResponse<UseVoucherPrepareResponse>` (4.5 참고)

> 🔑 **`eip712.message.merchant`는 실제 가맹점 지갑이 아니라 백엔드 지갑이다.**
> 컨트랙트 `useVoucherByMerchant`는 `msg.sender`(= 백엔드)를 `merchant` 자리에 넣어
> structHash를 계산하기 때문 (`Voucher.sol:148-167`). 실제 가맹점은
> `metadataHash`로 anchored되는 canonical JSON 영수증에만 기록된다.
> 관련 커밋: `0aa1686 — fix: EIP-712 merchant 필드 백엔드 지갑 주소로 수정`.

---

### 4.7 바우처 사용 실행

```
POST /api/vouchers/{id}/use
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | USER (소유자) |

사용자가 MetaMask `eth_signTypedData_v4`로 받은 서명값을 보내면 백엔드가
`useVoucherByMerchant(tokenId, amount, recordCommitmentHash, deadline, ownerSignature)`를 호출한다.

**Request Body**

```ts
interface UseVoucherRequest {
  historyId: number;       // 4.5/4.6에서 받은 historyId
  ownerSignature: string;  // 0x + 130 hex
}
```

**Response**

```ts
interface VoucherUseHistoryResponse {
  id: number;
  voucherId: number;
  onChainTokenId: number;
  merchantWallet: string;       // 실제 가맹점 지갑
  amount: number;
  oldValue: number;
  newValue: number;
  metadataHash: string;
  txHash: string;
  blockNumber: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  usedAt: string;
}
```

**Example**

```bash
curl -X POST http://localhost:8080/api/vouchers/42/use \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "historyId": 17,
    "ownerSignature": "0xab12...130hex"
  }'
```

**주요 에러 코드**

| code | 의미 |
|------|------|
| `USE_HISTORY_NOT_FOUND` | historyId가 존재하지 않음 |
| `USE_ALREADY_PROCESSED` | 이미 CONFIRMED/FAILED 처리됨 |
| `VOUCHER_ACCESS_DENIED` | history의 소유자 ≠ JWT subject |
| `USE_FAILED` | 컨트랙트 호출 실패 (서명 무효, deadline 초과 등) |

---

## 5. Merchant — 가맹점 전용

### 5.1 바우처 사용 준비 (가맹점 주도, QR 스캔 흐름)

```
POST /api/merchant/vouchers/use/prepare
```

| 항목 | 값 |
|------|----|
| 인증 | ✅ |
| Role | MERCHANT |

> 🔁 **새 QR 방향에서의 동작**: 가맹점이 결제 직전 자신의 QR(`merchantWallet`, `amount`, `paymentId`, `deadline`)을
> 화면에 띄우고 사용자가 스캔한다. 그 다음 **사용자**가 4.6 `/api/vouchers/{id}/use/prepare`를 호출하는 흐름이 표준이 될 것이다.
> 이 엔드포인트는 가맹점 단말에서 사용자 지갑/voucherId가 미리 확보된 데모/관리자 경로용으로 유지된다.

**Request Body**

```ts
interface MerchantPrepareRequest {
  voucherId: number;
  ownerWallet: string;     // 바우처 소유자 지갑
  amount: number;          // > 0
}
```

**Response**: `ApiResponse<UseVoucherPrepareResponse>` (4.5 참고)

**Example**

```bash
curl -X POST http://localhost:8080/api/merchant/vouchers/use/prepare \
  -H "Authorization: Bearer $MERCHANT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"voucherId":42,"ownerWallet":"0x90F8...","amount":15000}'
```

---

## 6. Metadata — ERC-721 tokenURI

### 6.1 메타데이터 조회

```
GET /api/metadata/{voucherId}
```

| 항목 | 값 |
|------|----|
| 인증 | ❌ |
| Role | — |

컨트랙트가 저장하는 `tokenURI`가 이 엔드포인트를 가리키므로 OpenSea / 지갑이 직접 호출한다.

**Response**

```ts
interface MetadataResponse {
  name: string;
  description: string | null;
  image: string;
  attributes: Array<{
    trait_type: "initial_value" | "current_value" | "status" | "valid_until";
    value: string | number;
  }>;
}
```

> ⚠️ 응답이 `ApiResponse<MetadataResponse>` 래퍼로 감싸여 있어 **OpenSea 표준과 호환되지 않을 수 있다.**
> 외부 마켓플레이스 노출 시 `data` 객체만 그대로 반환하도록 변경해야 한다 (열린 이슈, 아래 참고).

---

## 7. 전체 인증 흐름

### 7.1 시퀀스

```
┌────────────┐                ┌────────────┐               ┌────────────┐
│  프론트엔드 │                │   백엔드   │               │  MetaMask  │
└──────┬─────┘                └──────┬─────┘               └──────┬─────┘
       │                              │                            │
       │ ① 회원가입(최초 1회)         │                            │
       │ POST /api/members/user       │                            │
       ├─────────────────────────────►│                            │
       │  201 MemberResponse          │                            │
       │◄─────────────────────────────┤                            │
       │                              │                            │
       │ ② nonce 발급                 │                            │
       │ GET /api/auth/nonce/{addr}   │                            │
       ├─────────────────────────────►│                            │
       │  data: "<nonce>"             │                            │
       │◄─────────────────────────────┤                            │
       │                              │                            │
       │ ③ personal_sign 요청                                      │
       │ "Voucher 서비스 로그인\nNonce: <nonce>"                    │
       ├────────────────────────────────────────────────────────────►│
       │                                                            │
       │  signature (0x...130hex)                                   │
       │◄────────────────────────────────────────────────────────────┤
       │                              │                            │
       │ ④ 서명 검증 / JWT 발급        │                            │
       │ POST /api/auth/verify         │                            │
       │  { walletAddress, signature } │                            │
       ├─────────────────────────────►│                            │
       │                              │ recoverAddress 일치 확인   │
       │                              │ nonce 폐기(재발급)         │
       │  data: "<JWT>"               │                            │
       │◄─────────────────────────────┤                            │
       │                              │                            │
       │ ⑤ 이후 모든 보호 API         │                            │
       │ Authorization: Bearer <JWT>  │                            │
       ├─────────────────────────────►│                            │
       │                              │ JwtFilter → SecurityContext│
       │                              │  principal = walletAddress │
       │                              │  authority = ROLE_<role>   │
```

### 7.2 메시지 포맷 (반드시 일치)

`AuthService.buildSignMessage` (`AuthService.java:55-57`):

```
Voucher 서비스 로그인
Nonce: <UUID>
```

프론트는 정확히 동일한 문자열 (개행 1개, 공백 위치까지)을 `personal_sign`에 전달해야 한다.
달라지면 `recoverAddress` 결과가 변해서 `INVALID_SIGNATURE` 반환됨.

### 7.3 JWT 클레임

| 클레임 | 값 |
|--------|----|
| `sub` | 지갑 주소 (소문자/대문자 보존) |
| `role` | `"USER"` / `"MERCHANT"` / `"ADMIN"` |
| `iat` / `exp` | 발급/만료 시각 — `jwt.expiration` (ms) 설정값 사용 |

### 7.4 nonce 재사용 방지

`verify` 성공 시 백엔드가 즉시 새 UUID로 nonce를 갱신한다 (`AuthService.java:49`).
같은 signature를 두 번 보내면 두 번째 호출은 `INVALID_SIGNATURE` 처리된다.

---

## 부록 A. ErrorCode 전체 목록

`ErrorCode.java` 기준:

| code | HTTP | message |
|------|------|---------|
| `MEMBER_NOT_FOUND` | 404 | 회원을 찾을 수 없습니다. |
| `WALLET_ALREADY_EXISTS` | 409 | 이미 등록된 지갑 주소입니다. |
| `NOT_ADMIN` | 403 | 관리자 권한이 필요합니다. |
| `NOT_MERCHANT` | 400 | 가맹점 회원이 아닙니다. |
| `VOUCHER_PROGRAM_NOT_FOUND` | 404 | 바우처 프로그램을 찾을 수 없습니다. |
| `VOUCHER_PROGRAM_NAME_DUPLICATE` | 409 | 이미 존재하는 프로그램 이름입니다. |
| `VOUCHER_PROGRAM_INACTIVE` | 400 | 비활성화된 바우처 프로그램입니다. |
| `INVALID_SIGNATURE` | 401 | 서명 검증에 실패했습니다. |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰입니다. |
| `VOUCHER_NOT_FOUND` | 404 | 바우처를 찾을 수 없습니다. |
| `VOUCHER_ACCESS_DENIED` | 403 | 해당 바우처에 접근 권한이 없습니다. |
| `VOUCHER_NOT_ACTIVE` | 400 | 사용 가능한 상태의 바우처가 아닙니다. |
| `INSUFFICIENT_VOUCHER_VALUE` | 400 | 바우처 잔액이 부족합니다. |
| `WALLET_MISMATCH` | 403 | 요청 지갑 주소가 인증된 지갑과 일치하지 않습니다. |
| `MINT_FAILED` | 500 | 바우처 민팅에 실패했습니다. |
| `MINT_TIMEOUT` | 504 | 블록체인 트랜잭션 응답 대기 시간이 초과되었습니다. (40초) |
| `USE_HISTORY_NOT_FOUND` | 404 | 바우처 사용 이력을 찾을 수 없습니다. |
| `USE_ALREADY_PROCESSED` | 400 | 이미 처리된 결제 요청입니다. |
| `USE_FAILED` | 500 | 바우처 사용 처리에 실패했습니다. |

---

## 부록 B. 프론트 ↔ 백 연동 체크리스트

1. 회원가입(`POST /api/members/user`) 후 즉시 `/api/auth/nonce` → `personal_sign` → `/api/auth/verify`로 JWT 확보
2. JWT는 localStorage가 아닌 메모리 + httpOnly 쿠키 검토 (현재 구현은 미정 — 프론트 결정)
3. 결제 흐름은 반드시 다음 3단계로 진행:
   - prepare → `eip712` 받음
   - MetaMask `eth_signTypedData_v4(eip712)` 서명
   - `/api/vouchers/{id}/use`로 서명 전송
4. `eip712.message.merchant`는 백엔드 지갑이다 — 사용자 UI에는 `MerchantPrepareResponse`가 아닌
   별도 채널(canonical JSON에 있는 실제 가맹점 지갑)을 통해 받은 정보를 표시해야 함
