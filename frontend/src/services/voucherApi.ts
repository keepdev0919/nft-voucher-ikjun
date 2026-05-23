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
export type UseStatus = "PENDING" | "CONFIRMED";

export interface MemberResponse {
  id: number;
  walletAddress: string;
  nickname: string;
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
  amount: number;
  oldValue: number;
  newValue: number;
  metadataHash: string;
  txHash: string | null;
  blockNumber: number | null;
  status: UseStatus;
  usedAt: string;
}

// =============================================================================
// 요청 DTO 타입
// =============================================================================

export interface CreateUserRequestDto {
  walletAddress: string;
  nickname: string;
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
}

export interface CreateVoucherRequestDto {
  voucherProgramId: number;
  walletAddress: string;
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

export async function approveMerchantOnChain(
  walletAddress: string,
  approved: boolean
): Promise<MemberResponse> {
  const res = await axiosApi.post<ApiResponse<MemberResponse>>(
    `/api/members/merchant/${walletAddress}/approve`,
    null,
    { params: { approved } }
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

export async function issueVoucher(
  req: CreateVoucherRequestDto
): Promise<VoucherResponse> {
  const res = await axiosApi.post<ApiResponse<VoucherResponse>>(
    `/api/vouchers`,
    req
  );
  return res.data.data;
}

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

// =============================================================================
// Payment Session (신규 결제 흐름 — 가맹점이 QR 생성 → 사용자가 스캔)
// =============================================================================
//
// 흐름:
//   1) [가맹점] POST /api/merchant/payment-session { amount }
//        → PaymentSessionResponse { paymentId, merchantWallet, amount, deadline, status: PENDING }
//   2) [가맹점] paymentId+merchantWallet+amount+deadline 4개 필드를 QR로 인코딩해 화면에 표시
//   3) [가맹점] GET /api/merchant/payment-status/{paymentId} 를 2초 간격으로 폴링
//   4) [사용자] QR 스캔 → 본인 ACTIVE 바우처 선택 → prepareUseVoucher(paymentId 포함) →
//      EIP-712 서명 → executeUseVoucher
//   5) [백엔드] executeUseVoucher 성공 시 PaymentSession.status = COMPLETED + txHash 기록
//   6) [가맹점] 다음 폴링에서 COMPLETED 감지 → "결제 완료!" 화면 전환

export type PaymentSessionStatus =
  | "PENDING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELED";

export interface PaymentSessionResponse {
  paymentId: string; // UUID 36자
  merchantWallet: string; // 0x... lowercase
  amount: number;
  deadline: number; // epoch seconds (UNIX timestamp)
  status: PaymentSessionStatus;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentSessionStatus;
  txHash: string | null;
  completedAt: string | null; // ISO LocalDateTime
}

export interface CreatePaymentSessionRequest {
  amount: number;
}

export async function createPaymentSession(
  req: CreatePaymentSessionRequest
): Promise<PaymentSessionResponse> {
  const res = await axiosApi.post<ApiResponse<PaymentSessionResponse>>(
    `/api/merchant/payment-session`,
    req
  );
  return res.data.data;
}

export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  const res = await axiosApi.get<ApiResponse<PaymentStatusResponse>>(
    `/api/merchant/payment-status/${paymentId}`
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
