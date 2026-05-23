// JWT 토큰과 지갑 주소를 localStorage에 보관/조회/삭제하는 유틸.
// 키 이름은 SecurityConfig 변경 전후로 보존되어야 하니 변경 시 다른 모듈도 확인할 것.

const JWT_KEY = "voucher_jwt";
const WALLET_KEY = "voucher_wallet";

export function saveToken(jwt: string): void {
  try {
    localStorage.setItem(JWT_KEY, jwt);
  } catch {
    // SSR/Private 모드 등 localStorage 사용 불가 환경 — 무시
  }
}

export function loadToken(): string | null {
  try {
    return localStorage.getItem(JWT_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(JWT_KEY);
  } catch {
    // 무시
  }
}

export function saveWallet(address: string): void {
  try {
    localStorage.setItem(WALLET_KEY, address);
  } catch {
    // 무시
  }
}

export function loadWallet(): string | null {
  try {
    return localStorage.getItem(WALLET_KEY);
  } catch {
    return null;
  }
}

export function clearWallet(): void {
  try {
    localStorage.removeItem(WALLET_KEY);
  } catch {
    // 무시
  }
}
