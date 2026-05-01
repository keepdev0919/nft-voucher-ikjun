export type VoucherStatus = "active" | "pending" | "used" | "expired";

export interface Voucher {
  tokenId: number;
  name: string;
  category: "food" | "transport" | "book" | "medical" | "other";
  amount: number;
  remainingAmount: number;
  status: VoucherStatus;
  expiresAt: string;
  issuedBy: string;
  allowedCategories: string[];
  tokenAddress: string;
}

export const STATUS_LABEL: Record<VoucherStatus, string> = {
  active: "사용 가능",
  pending: "심사 중",
  used: "사용 완료",
  expired: "만료됨",
};

export const CATEGORY_ICON: Record<Voucher["category"], string> = {
  food: "🍽️",
  transport: "🚌",
  book: "📚",
  medical: "💊",
  other: "🎫",
};

export const CATEGORY_LABEL: Record<Voucher["category"], string> = {
  food: "식비",
  transport: "교통",
  book: "도서",
  medical: "의료",
  other: "기타",
};
