import { useState, useRef, useCallback } from "react";
import { getMyVouchers } from "../services/voucherApi";
import { Voucher, VoucherStatus } from "../types/voucher";

// API 응답 status (1/2/3) → 프론트 타입 변환
const STATUS_MAP: Record<number, VoucherStatus> = {
  1: "active",
  2: "used",
  3: "expired",
};

// API 응답의 카테고리 문자열 → Voucher category 변환
function parseCategory(cat: string): Voucher["category"] {
  const map: Record<string, Voucher["category"]> = {
    food: "food",
    식비: "food",
    transport: "transport",
    교통: "transport",
    book: "book",
    도서: "book",
    medical: "medical",
    의료: "medical",
  };
  return map[cat] ?? "other";
}

function mapApiVoucher(item: any): Voucher {
  const status = STATUS_MAP[Number(item.status)] ?? "active";
  // expiryDate가 타임스탬프(초)인 경우 날짜 문자열로 변환
  let expiresAt = item.expiryDate ?? item.expiresAt ?? "";
  if (typeof expiresAt === "number" || /^\d+$/.test(String(expiresAt))) {
    const d = new Date(Number(expiresAt) * 1000);
    expiresAt = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  return {
    tokenId: Number(item.tokenId),
    name: item.programName ?? item.name ?? "바우처",
    category: parseCategory(item.category ?? ""),
    amount: Number(item.amount ?? 0),
    remainingAmount: Number(item.remainingAmount ?? item.amount ?? 0),
    status,
    expiresAt,
    issuedBy: item.issuedBy ?? item.issuer ?? "",
    allowedCategories: item.allowedCategories ?? [],
    tokenAddress: item.tokenAddress ?? item.owner ?? "",
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5분

interface CacheEntry {
  data: Voucher[];
  timestamp: number;
}

export function useVoucherList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const fetchVouchers = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    // 캐시 확인
    const cached = cacheRef.current.get(walletAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setVouchers(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getMyVouchers(walletAddress);
      const data: Voucher[] = (res.data?.body ?? []).map(mapApiVoucher);
      cacheRef.current.set(walletAddress, { data, timestamp: Date.now() });
      setVouchers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "바우처 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidateCache = useCallback((walletAddress?: string) => {
    if (walletAddress) {
      cacheRef.current.delete(walletAddress);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return { vouchers, loading, error, fetchVouchers, invalidateCache };
}
