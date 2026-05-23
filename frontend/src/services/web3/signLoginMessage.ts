// MetaMask personal_sign으로 로그인 메시지를 서명한다.
// 메시지 포맷은 백엔드 AuthService.buildSignMessage와 반드시 동일해야 한다.
//
// window.ethereum 타입은 react-app-env.d.ts에서 이미 `any`로 선언돼 있으므로
// 본 파일에서 추가 declare global을 두지 않는다 (중복 선언 충돌 방지).

/**
 * 백엔드와 약속된 포맷으로 메시지를 만든 뒤 MetaMask로 서명한다.
 *
 * 백엔드 검증식 (AuthService.buildSignMessage):
 *   "Voucher 서비스 로그인\nNonce: " + nonce
 *
 * 한 글자라도 다르면 INVALID_SIGNATURE로 거부되니 손대지 말 것.
 */
export async function signLoginMessage(
  walletAddress: string,
  nonce: string
): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }

  const message = `Voucher 서비스 로그인\nNonce: ${nonce}`;

  try {
    const signature: string = await eth.request({
      method: "personal_sign",
      params: [message, walletAddress],
    });
    return signature;
  } catch (err: unknown) {
    // EIP-1193 사용자 거부 코드는 4001
    const code = (err as { code?: number })?.code;
    if (code === 4001) {
      throw new Error("사용자가 서명을 거부했습니다.");
    }
    throw err;
  }
}
