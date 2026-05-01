import axios from "axios";

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080/voucher`,
  timeout: 10000,
});

// --- DTO 타입 ---

export interface CreateProgramDto {
  name: string;
  amount: number;
  expiryDate: string;
  totalSupply: number;
  category: string;
  issuerWallet: string;
  programId: number;
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

// --- 지수 백오프 유틸 ---

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// --- API 함수 ---

export const checkUser = (walletAddress: string) =>
  api.get(`/user/check`, { params: { walletAddress } });

export const registerNickname = (walletAddress: string, nickname: string) =>
  api.post(`/user/nickname`, { walletAddress, nickname });

export const getProgramList = () =>
  api.get(`/program/list`);

export const createProgram = (data: CreateProgramDto) =>
  api.post(`/program/create`, data);

export const getMyVouchers = (walletAddress: string) =>
  api.get(`/voucher/my/${walletAddress}`);

export const getVoucherHistory = (walletAddress: string) =>
  api.get(`/voucher/history`, { params: { walletAddress } });

export const getMerchantList = () =>
  api.get(`/merchant/list`);

export const registerMerchant = (data: MerchantRegisterDto) =>
  api.post(`/merchant/register`, data);

export const verifyVoucher = (tokenId: number) =>
  api.get(`/merchant/verify/${tokenId}`);

export const logVoucherUse = (data: VoucherUseDto) =>
  api.post(`/voucher/use`, data);

// 재시도 로직: 컨트랙트 성공 후 백엔드 로그 저장용
export async function logVoucherUseWithRetry(data: VoucherUseDto, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await logVoucherUse(data);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
