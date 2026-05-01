import { Voucher } from "../types/voucher";

const STORAGE_KEY = "mock_vouchers";

export function getMockVouchers(): Voucher[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addMockVoucher(voucher: Voucher): void {
  const current = getMockVouchers();
  if (current.some((v) => v.tokenId === voucher.tokenId)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, voucher]));
}

export function clearMockVouchers(): void {
  localStorage.removeItem(STORAGE_KEY);
}
