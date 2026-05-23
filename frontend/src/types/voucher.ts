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

// =============================================================================
// 백엔드 program.category(문자열) → 이모지 매핑
// VoucherResponse.programCategory / VoucherQrResponse.category 양쪽에서 공용 사용.
// =============================================================================

export const CATEGORY_ICONS: Record<string, string> = {
  "일반 음식점": "🍽️",
  "영화관": "🎬",
  "카페": "☕",
  "편의점": "🏪",
};

export const DEFAULT_CATEGORY_ICON = "🎫";

export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON;
}

// =============================================================================
// 만료일 뱃지 계산 — programValidUntil(ISO LocalDateTime) 기반.
// =============================================================================

export type ExpiryTone = "ok" | "warn" | "expired";

export interface ExpiryBadge {
  label: string;
  tone: ExpiryTone;
  /** 남은 일수(만료된 경우 음수). 기한이 없는 경우 null. */
  days: number | null;
}

export function expiryBadge(programValidUntil: string | null | undefined): ExpiryBadge {
  if (!programValidUntil) return { label: "기한 없음", tone: "ok", days: null };
  const ts = new Date(programValidUntil).getTime();
  if (isNaN(ts)) return { label: "기한 없음", tone: "ok", days: null };
  const days = Math.ceil((ts - Date.now()) / 86400000);
  if (days < 0) return { label: "만료됨", tone: "expired", days };
  if (days <= 7) return { label: `D-${days}`, tone: "warn", days };
  return { label: `D-${days}`, tone: "ok", days };
}

/** 만료 뱃지 tone → Tailwind 클래스 */
export const EXPIRY_TONE_STYLE: Record<ExpiryTone, string> = {
  ok: "text-v-textMuted",
  warn: "bg-amber-100 text-amber-700",
  expired: "bg-v-errorLight text-v-error",
};
