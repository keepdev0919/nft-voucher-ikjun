import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMerchantHistory,
  VoucherUseHistoryResponse,
} from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MerchantHome() {
  const navigate = useNavigate();
  const { nickname } = useWallet();
  const [records, setRecords] = useState<VoucherUseHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMerchantHistory()
      .then(setRecords)
      .catch((err) => {
        setToast(err?.response?.data?.message ?? "결제 내역을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  // CONFIRMED 결제만 집계 (PENDING/FAILED 제외)
  const confirmed = records.filter((r) => r.status === "CONFIRMED");
  const totalAmount = confirmed.reduce((sum, r) => sum + r.amount, 0);
  const recentThree = confirmed.slice(0, 3);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6">
        <p className="text-[13px] text-v-textMuted">가맹점 대시보드</p>
        <h1 className="text-[22px] font-bold text-v-text mt-0.5">{nickname ?? "가맹점"}님</h1>
      </div>

      {/* 매출 요약 카드 */}
      <div className="px-6 mt-4">
        <div
          className="rounded-v-lg p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 160,
              height: 160,
              top: -40,
              right: -40,
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <p className="text-xs text-white/70 font-medium">총 매출</p>
          <p className="text-[32px] font-bold text-white mt-1 tracking-tight">
            {loading ? "..." : `${totalAmount.toLocaleString("ko-KR")}원`}
          </p>
          <p className="text-[11px] text-white/60 mt-1">
            누적 결제 {confirmed.length}건 · 실시간 온체인 집계
          </p>
        </div>
      </div>

      {/* 결제 받기 CTA */}
      <div className="px-6 mt-3">
        <button
          onClick={() => navigate("/merchant/scan")}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
          </svg>
          결제 받기 (QR 스캔)
        </button>
      </div>

      {/* 최근 결제 내역 */}
      <div className="px-6 mt-5 pb-6">
        <h2 className="text-sm font-semibold text-v-text mb-2">최근 결제 내역</h2>
        {loading ? (
          <div className="flex justify-center mt-8">
            <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
          </div>
        ) : recentThree.length === 0 ? (
          <div className="bg-v-surface rounded-v-lg p-6 text-center shadow-v-sm">
            <p className="text-v-textMuted text-sm">아직 결제 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentThree.map((r) => (
              <div
                key={r.id}
                className="bg-v-surface rounded-v-lg px-4 py-3 shadow-v-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-v-text">
                    바우처 #{r.onChainTokenId ?? "-"}
                  </p>
                  <p className="text-[11px] text-v-textMuted mt-0.5">{formatTime(r.usedAt)}</p>
                </div>
                <p className="text-sm font-bold text-v-accent">
                  {r.amount.toLocaleString("ko-KR")}원
                </p>
              </div>
            ))}
            {confirmed.length > 3 && (
              <button
                onClick={() => navigate("/merchant/history")}
                className="w-full py-2 text-xs text-v-accent font-medium"
              >
                전체 내역 보기 →
              </button>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </div>
  );
}
