import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import VoucherListItem from "../../components/voucher/VoucherListItem";

export default function VoucherHome() {
  const navigate = useNavigate();
  const { walletAddress, nickname } = useWallet();
  const { vouchers, loading, error, fetchVouchers } = useVoucherList();

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  const activeVouchers = vouchers.filter(
    (v) => v.status === "active" || v.status === "pending"
  );
  const total = activeVouchers.reduce((sum, v) => sum + v.remainingAmount, 0);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6">
        <p className="text-[13px] text-v-textMuted">안녕하세요</p>
        <h1 className="text-[22px] font-bold text-v-text mt-0.5">{nickname ?? "사용자"}님</h1>
      </div>

      {/* 잔여 금액 카드 */}
      <div className="px-6 mt-4">
        <div
          className="rounded-v-lg p-5 relative overflow-hidden cursor-pointer"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
          onClick={() => navigate("/voucher/list")}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }}
          />
          <p className="text-xs text-white/70 font-medium">총 잔여 금액</p>
          <p className="text-[26px] font-bold text-white mt-1 tracking-tight">
            {loading ? (
              <span className="inline-block w-24 h-7 bg-white/20 rounded animate-pulse" />
            ) : (
              `${total.toLocaleString("ko-KR")}원`
            )}
          </p>
          <p className="text-[11px] text-white/65 mt-1">
            활성 바우처 {loading ? "-" : activeVouchers.length}개
          </p>
        </div>
      </div>

      {/* 빠른 액세스 */}
      <div className="px-6 mt-3 flex gap-3">
        <button
          onClick={() => navigate("/voucher/scan")}
          className="flex-1 py-3.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-semibold active:bg-v-accent/20 transition-colors"
        >
          QR 스캔
        </button>
        <button
          onClick={() => navigate("/voucher/list")}
          className="flex-1 py-3.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-semibold active:bg-v-accent/20 transition-colors"
        >
          전체 보기
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-6 mt-3">
          <div className="bg-red-50 border border-red-200 rounded-v-md px-4 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* 최근 바우처 */}
      <div className="px-6 mt-5">
        <h2 className="text-sm font-semibold text-v-text mb-2">최근 바우처</h2>

        {loading ? (
          <div className="bg-v-surface rounded-v-lg px-4 py-6 shadow-v-sm flex justify-center">
            <span className="w-6 h-6 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="bg-v-surface rounded-v-lg px-4 py-6 shadow-v-sm text-center">
            <p className="text-v-textMuted text-sm">보유한 바우처가 없습니다</p>
          </div>
        ) : (
          <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
            {vouchers.slice(0, 3).map((v) => (
              <VoucherListItem
                key={v.tokenId}
                voucher={v}
                onClick={() => navigate(`/voucher/list/${v.tokenId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
