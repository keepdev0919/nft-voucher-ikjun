import { useState, useEffect, useCallback } from "react";
import {
  getMyVouchersList,
  VoucherResponse,
} from "../services/voucherApi";

/**
 * 사용자의 보유 바우처 목록을 백엔드에서 조회한다.
 *
 * 신규 API(`GET /api/vouchers/my/{walletAddress}`)는 ApiResponse 래퍼가 풀린
 * `VoucherResponse[]`를 그대로 반환한다. 401 응답은 axiosApi 인터셉터가
 * /login 으로 리다이렉트하므로 여기서는 별도로 처리하지 않는다.
 *
 * 졸업 데모 단계라 캐시는 두지 않는다 — 화면 진입마다 새로 불러온다.
 */
export function useVoucherList() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const fetchVouchers = useCallback(async (addr: string) => {
    if (!addr) return;
    setWalletAddress(addr);
    setLoading(true);
    setError(null);
    try {
      const data = await getMyVouchersList(addr);
      setVouchers(data);
    } catch (e: any) {
      setVouchers([]);
      setError(
        e?.response?.data?.message ?? "바우처 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (walletAddress) {
      void fetchVouchers(walletAddress);
    }
  }, [walletAddress, fetchVouchers]);

  return { vouchers, loading, error, fetchVouchers, refetch };
}
