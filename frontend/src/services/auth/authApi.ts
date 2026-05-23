import axiosApi from "../axiosApi";

// 백엔드 ApiResponse 래퍼. axiosApi의 모든 응답은 이 형태로 래핑돼 들어온다.
interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

/**
 * 로그인용 1회성 nonce 발급.
 * GET /api/auth/nonce/{walletAddress}
 *
 * 백엔드는 회원이 존재해야 nonce를 발급한다. 미가입 지갑은 MEMBER_NOT_FOUND 에러.
 */
export async function getNonce(walletAddress: string): Promise<string> {
  const res = await axiosApi.get<ApiResponse<string>>(
    `/api/auth/nonce/${walletAddress}`
  );
  return res.data.data;
}

/**
 * personal_sign으로 서명한 값을 검증하고 JWT를 발급받는다.
 * POST /api/auth/verify
 *
 * 성공 시 반환값은 JWT 문자열. 호출자가 tokenStorage.saveToken으로 저장해야 한다.
 */
export async function verifyLogin(
  walletAddress: string,
  signature: string
): Promise<string> {
  const res = await axiosApi.post<ApiResponse<string>>("/api/auth/verify", {
    walletAddress,
    signature,
  });
  return res.data.data;
}
