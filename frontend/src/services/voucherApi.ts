import axiosApi from "./axiosApi";

// =============================================================================
// ApiResponse 공통 래퍼
// =============================================================================
//
// 팀 백엔드는 모든 응답을 ApiResponse<T>로 감싸 반환한다.
//   { success: boolean, data: T, code?: string, message?: string }
// 본 모듈의 신규 함수들은 모두 res.data.data 까지 풀어서 T를 그대로 반환한다.
//
// 단, 기존 페이지(레거시 ttocket/voucher 페이지)가 사용하던 함수 시그니처는
// 컴파일을 깨뜨리지 않기 위해 파일 하단에서 별도로 유지한다.

interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

// =============================================================================
// 백엔드 DTO 타입 (com.voucher.dto.response / domain.enums 매핑)
// =============================================================================

export type Role = "USER" | "MERCHANT" | "ADMIN";
export type ProgramStatus = "ACTIVE" | "PAUSED" | "ENDED";
export type VoucherStatus = "PENDING" | "ACTIVE" | "USED_UP" | "BURNED";
export type UseStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface MemberResponse {
  id: number;
  walletAddress: string;
  nickname: string;
  name: string | null;
  birthDate: string | null; // ISO date "YYYY-MM-DD"
  region: string | null;
  role: Role;
  category: string | null;
  createdAt: string; // LocalDateTime → ISO string
}

export interface VoucherProgramResponse {
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
  status: ProgramStatus;
  minAge: number | null;
  maxAge: number | null;
  allowedRegions: string | null; // 콤마 구분, 예: "서울,경기"
  usageGuide: string | null;
  issuanceGuide: string | null;
  refundPolicy: string | null;
  createdAt: string;
}

export interface VoucherResponse {
  id: number;
  onChainTokenId: number | null;
  voucherProgramId: number;
  programName: string;
  ownerId: number;
  ownerWallet: string;
  ownerNickname: string;
  currentValue: number;
  initialValue: number;
  programCategory: string;
  programValidUntil: string | null; // ISO LocalDateTime (no timezone)
  issuedBy: string; // 발행 기관 지갑 주소
  tokenUri: string | null;
  txHash: string | null;
  blockNumber: number | null;
  status: VoucherStatus;
  mintedAt: string | null;
  createdAt: string;
}

export interface VoucherQrResponse {
  voucherId: number;
  ownerWallet: string;
  ownerNickname: string;
  onChainTokenId: number | null;
  currentValue: number;
  programName: string;
  category: string; // 백엔드는 QR 응답에서 SHORT 명(category)을 사용
  expiryDate: string | null;
  isValid: boolean; // 백엔드 계산: ACTIVE + currentValue>0 + not expired
}

export interface UseVoucherPrepareResponse {
  historyId: number;
  voucherId: number;          // executeUse 호출 시 경로 변수로 필요
  amount: number;             // 결제 금액 (화면 표시용, 원 단위)
  merchantNickname: string;   // 가맹점 닉네임 (화면 표시용)
  programName: string;        // 바우처 프로그램명 (화면 표시용)
  metadataHash: string;
  nonce: string; // BigInteger → 문자열로 전달됨
  deadline: number;
  eip712: Record<string, any>;
}

export interface VoucherUseHistoryResponse {
  id: number;
  voucherId: number;
  onChainTokenId: number | null;
  merchantWallet: string;
  merchantNickname: string;
  programName: string;
  amount: number;
  oldValue: number;
  newValue: number;
  metadataHash: string;
  txHash: string | null;
  blockNumber: number | null;
  status: UseStatus;
  deadline: number;
  usedAt: string | null;
}

// =============================================================================
// 요청 DTO 타입
// =============================================================================

export interface CreateUserRequestDto {
  walletAddress: string;
  nickname: string;
  name: string;
  birthDate: string; // ISO date "YYYY-MM-DD"
  region: string;
}

export interface ApplyVoucherRequestDto {
  voucherProgramId: number;
  walletAddress: string;
}

export interface CreateMerchantRequestDto {
  walletAddress: string;
  nickname: string;
  category: string;
}

export interface CreateVoucherProgramRequest {
  walletAddress: string;
  name: string;
  description?: string;
  maxValue: number;
  totalSupply: number;
  category: string;
  validFrom: string; // ISO 8601
  validUntil: string;
  minAge?: number;
  maxAge?: number;
  allowedRegions?: string; // 콤마 구분, 예: "서울,경기"
  usageGuide?: string;
  issuanceGuide?: string;
  refundPolicy?: string;
}

export interface UseVoucherPrepareRequestDto {
  merchantWallet: string;
  amount: number;
  /**
   * 신규 결제 흐름(가맹점이 QR 생성 → 사용자 스캔) 전용.
   * 백엔드는 paymentId로 PaymentSession을 찾아 amount/merchantWallet 일치 여부를 검증하고,
   * 결제 성공 시 세션 상태를 COMPLETED로 마킹한다.
   * 옛 흐름(사용자 QR → 가맹점 스캔)에서는 생략한다.
   */
  paymentId?: string;
}

export interface UseVoucherRequestDto {
  historyId: number;
  ownerSignature: string;
}

export interface MerchantPrepareRequestDto {
  voucherId: number;
  ownerWallet: string;
  amount: number;
}

// =============================================================================
// Members
// =============================================================================

export async function checkMemberExists(walletAddress: string): Promise<boolean> {
  const res = await axiosApi.get<ApiResponse<boolean>>(
    `/api/members/check/${walletAddress}`
  );
  return res.data.data;
}

export async function registerUser(
  req: CreateUserRequestDto
): Promise<MemberResponse> {
  const res = await axiosApi.post<ApiResponse<MemberResponse>>(
    `/api/members/user`,
    req
  );
  return res.data.data;
}

// 자격 기반 자동 신청 — 백엔드가 회원의 birthDate/region을 프로그램의
// minAge/maxAge/allowedRegions와 비교해 통과 시 자동 민팅, 미달 시 거부.
export async function applyVoucher(
  req: ApplyVoucherRequestDto
): Promise<VoucherResponse> {
  const res = await axiosApi.post<ApiResponse<VoucherResponse>>(
    `/api/vouchers/apply`,
    req
  );
  return res.data.data;
}

export async function registerMerchant(
  req: CreateMerchantRequestDto
): Promise<MemberResponse> {
  const res = await axiosApi.post<ApiResponse<MemberResponse>>(
    `/api/members/merchant`,
    req
  );
  return res.data.data;
}

export async function getMember(walletAddress: string): Promise<MemberResponse> {
  const res = await axiosApi.get<ApiResponse<MemberResponse>>(
    `/api/members/${walletAddress}`
  );
  return res.data.data;
}

// =============================================================================
// Voucher Programs
// =============================================================================

export async function createVoucherProgram(
  req: CreateVoucherProgramRequest
): Promise<VoucherProgramResponse> {
  const res = await axiosApi.post<ApiResponse<VoucherProgramResponse>>(
    `/api/voucher-programs`,
    req
  );
  return res.data.data;
}

export async function getActivePrograms(): Promise<VoucherProgramResponse[]> {
  const res = await axiosApi.get<ApiResponse<VoucherProgramResponse[]>>(
    `/api/voucher-programs`
  );
  return res.data.data;
}

export async function getVoucherProgram(
  id: number
): Promise<VoucherProgramResponse> {
  const res = await axiosApi.get<ApiResponse<VoucherProgramResponse>>(
    `/api/voucher-programs/${id}`
  );
  return res.data.data;
}

// =============================================================================
// Vouchers
// =============================================================================

// 신규 시그니처: 백엔드 ApiResponse를 풀어서 VoucherResponse[] 그대로 반환.
// 기존 hooks/useVoucherList.ts 가 res.data.body 형태로 접근하는 레거시 시그니처는
// 파일 하단의 legacyGetMyVouchers / 기본 export 별칭으로 유지된다.
export async function getMyVouchersList(
  walletAddress: string
): Promise<VoucherResponse[]> {
  const res = await axiosApi.get<ApiResponse<VoucherResponse[]>>(
    `/api/vouchers/my/${walletAddress}`
  );
  return res.data.data;
}

export async function getVoucher(
  id: number,
  walletAddress: string
): Promise<VoucherResponse> {
  const res = await axiosApi.get<ApiResponse<VoucherResponse>>(
    `/api/vouchers/${id}`,
    { params: { walletAddress } }
  );
  return res.data.data;
}

export async function getVoucherQrData(id: number): Promise<VoucherQrResponse> {
  const res = await axiosApi.get<ApiResponse<VoucherQrResponse>>(
    `/api/vouchers/${id}/qr`
  );
  return res.data.data;
}

export async function getPendingUseRequests(): Promise<
  UseVoucherPrepareResponse[]
> {
  const res = await axiosApi.get<ApiResponse<UseVoucherPrepareResponse[]>>(
    `/api/vouchers/pending-use`
  );
  return res.data.data;
}

export async function prepareUseVoucher(
  id: number,
  req: UseVoucherPrepareRequestDto
): Promise<UseVoucherPrepareResponse> {
  const res = await axiosApi.post<ApiResponse<UseVoucherPrepareResponse>>(
    `/api/vouchers/${id}/use/prepare`,
    req
  );
  return res.data.data;
}

export async function executeUseVoucher(
  id: number,
  req: UseVoucherRequestDto
): Promise<VoucherUseHistoryResponse> {
  const res = await axiosApi.post<ApiResponse<VoucherUseHistoryResponse>>(
    `/api/vouchers/${id}/use`,
    req
  );
  return res.data.data;
}

// =============================================================================
// Merchant
// =============================================================================

export async function merchantPrepareUse(
  req: MerchantPrepareRequestDto
): Promise<UseVoucherPrepareResponse> {
  const res = await axiosApi.post<ApiResponse<UseVoucherPrepareResponse>>(
    `/api/merchant/vouchers/use/prepare`,
    req
  );
  return res.data.data;
}

// 가맹점 본인이 받은 결제 내역 — 최신순. JWT 지갑 = 가맹점.
export async function getMerchantHistory(): Promise<VoucherUseHistoryResponse[]> {
  const res = await axiosApi.get<ApiResponse<VoucherUseHistoryResponse[]>>(
    `/api/merchant/history`
  );
  return res.data.data;
}

// 특정 결제 요청의 status만 조회. 가맹점이 prepare 후 사용자 서명 완료
// 여부를 폴링할 때 사용. 반환값: "PENDING" | "CONFIRMED" | "FAILED".
export async function getMerchantHistoryStatus(historyId: number): Promise<UseStatus> {
  const res = await axiosApi.get<ApiResponse<{ status: UseStatus }>>(
    `/api/merchant/history/${historyId}/status`
  );
  return res.data.data.status;
}

// =============================================================================
// Admin — 토큰 무결성 검증 (온체인 vs DB 일치 여부 확인)
// =============================================================================
//
// 백엔드가 같은 tokenId 의 NFT 상태를 (1) 스마트 컨트랙트 (2) MySQL 두 곳에서
// 동시에 조회한 뒤 잔액/해시/nonce 3가지 축으로 비교 결과를 돌려준다.
// status:
//   - VERIFIED         : 양쪽 모두 존재 + 3축 모두 일치
//   - MISMATCH         : 양쪽 모두 존재하나 하나 이상 불일치
//   - MISSING_DB       : 온체인엔 있는데 DB 누락
//   - MISSING_ONCHAIN  : DB엔 있는데 온체인 누락

export interface VerificationResponse {
  tokenId: number;
  status: "VERIFIED" | "MISMATCH" | "MISSING_DB" | "MISSING_ONCHAIN";

  dbValue: number | null;
  onChainValue: number | null;
  valueMatch: boolean;

  dbHashes: string[] | null;
  onChainHashes: string[] | null;
  hashMatch: boolean;

  dbNonce: number | null;
  onChainNonce: number | null;
  nonceMatch: boolean;

  ownerWallet: string | null;
  programName: string | null;
  checkedAt: string;
  message: string;
}

export async function verifyToken(tokenId: number): Promise<VerificationResponse> {
  const res = await axiosApi.get<ApiResponse<VerificationResponse>>(
    `/api/verify/${tokenId}`
  );
  return res.data.data;
}

// =============================================================================
// 레거시 호환용 export
// =============================================================================
//
// 아래는 백엔드 리뉴얼 이전 voucherApi.ts가 노출하던 시그니처를 유지하기 위한
// 어댑터들이다. 새 페이지에서는 위의 신규 함수들을 사용할 것. 레거시 페이지를
// 새 API로 마이그레이션하면 이 블록은 통째로 삭제한다.

export interface CreateProgramDto {
  name: string;
  amount: number;
  expiryDate: string;
  totalSupply: number;
  category: string;
  issuerWallet: string;
}

export interface MerchantRegisterDto {
  walletAddress: string;
  name: string;
  category: string;
}

export interface VoucherUseDto {
  tokenId: number;
  merchantWallet: string;
  usedAmount: number;
  txHash: string;
}

// 기존 페이지들이 res.data 형태로 접근하므로 raw axios 응답을 그대로 돌려준다.

export const checkUser = (walletAddress: string) =>
  axiosApi.get(`/api/members/check/${walletAddress}`);

export const registerNickname = (walletAddress: string, nickname: string) =>
  axiosApi.post(`/api/members/user`, { walletAddress, nickname });

export const getProgramList = () => axiosApi.get(`/api/voucher-programs`);

export const createProgram = (data: CreateProgramDto) =>
  axiosApi.post(`/api/voucher-programs`, data);

// 기존 hooks/useVoucherList.ts 가 res.data?.body 로 접근하므로 동일한 형태를 흉내낸다.
export const getMyVouchers = (walletAddress: string) =>
  axiosApi.get(`/api/vouchers/my/${walletAddress}`);

export const getVoucherHistory = (walletAddress: string) =>
  axiosApi.get(`/api/vouchers/my/${walletAddress}`);

export const verifyVoucher = (tokenId: number) =>
  axiosApi.get(`/api/vouchers/${tokenId}/qr`);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const logVoucherUse = (data: VoucherUseDto) =>
  axiosApi.post(`/api/vouchers/${data.tokenId}/use`, data);

export async function logVoucherUseWithRetry(
  data: VoucherUseDto,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await logVoucherUse(data);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
