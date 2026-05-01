# API 명세

> 백엔드(정재현) + 프론트엔드(조익준) 협의용 문서
> 구현 전 여기서 입출력 형식 먼저 합의하고 시작

## 기본 정보

- Base URL: `http://localhost:8080/voucher`
- 응답 형식: JSON

## 공통 응답 형식

```json
{
  "status_code": 200,
  "message": "success",
  "body": { ... }
}
```

---

## 사용자 API

### 로그인 / 회원 확인
```
GET /user/check/{walletAddress}
```
응답:
```json
{
  "status_code": 200,
  "body": "홍길동"          // 닉네임 (없으면 400)
}
```

### 닉네임 등록
```
POST /user/nickname
```
요청:
```json
{
  "walletAddress": "0x123...",
  "nickname": "홍길동"
}
```

---

## 바우처 프로그램 API

### 신청 가능한 바우처 목록
```
GET /program/list
```
응답:
```json
{
  "body": [
    {
      "programId": 1,
      "name": "2026 청년 식비 지원",
      "amount": 50000,
      "expiryDate": "2026-12-31",
      "category": "음식점,마트",
      "remainCount": 850
    }
  ]
}
```

### 바우처 프로그램 생성 (기관)
```
POST /program/create
```
요청:
```json
{
  "name": "2026 청년 식비 지원",
  "amount": 50000,
  "expiryDate": "2026-12-31",
  "totalSupply": 1000,
  "category": "음식점,마트",
  "issuerWallet": "0x123..."
}
```

---

## 바우처 API

### 내 바우처 목록
```
GET /voucher/my/{walletAddress}
```
응답:
```json
{
  "body": [
    {
      "tokenId": 1,
      "programName": "2026 청년 식비 지원",
      "amount": 50000,
      "expiryDate": "2026-12-31",
      "status": 1
    }
  ]
}
```

### 사용 내역
```
GET /voucher/history/{walletAddress}
```

---

## 가맹점 API

### 가맹점 목록
```
GET /merchant/list
```

### 가맹점 등록 신청
```
POST /merchant/register
```
요청:
```json
{
  "walletAddress": "0x456...",
  "name": "홍길동 식당",
  "category": "음식점"
}
```

### QR 스캔 후 바우처 검증
```
GET /merchant/verify/{tokenId}
```
응답:
```json
{
  "body": {
    "isValid": true,
    "ownerName": "홍길동",
    "amount": 50000,
    "expiryDate": "2026-12-31"
  }
}
```

### 사용 처리 로그 저장
```
POST /merchant/use
```
요청:
```json
{
  "tokenId": 1,
  "merchantWallet": "0x456...",
  "usedAmount": 35000
}
```

---

## 프론트-백 연동 규칙

1. 프론트가 API 먼저 호출 → 목록/정보 가져옴
2. 결제/민팅/사용 처리는 Web3.js로 스마트 컨트랙트 직접 호출
3. 컨트랙트 처리 성공 후 → 백엔드에 로그 저장 API 호출
