import React, { useEffect, useState } from "react";
import { getVoucherHistory } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

interface UseRecord {
  tokenId: number;
  usedAmount: number;
  usedAt: string;
  txHash?: string;
}

function formatDate(val: string | number): string {
  if (!val) return "-";
  // 타임스탬프(초)
  if (typeof val === "number" || /^\d{10,}/.test(String(val))) {
    const d = new Date(Number(val) * 1000);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return String(val);
}

export default function MerchantHistory() {
  const { walletAddress } = useWallet();
  const [records, setRecords] = useState<UseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    getVoucherHistory(walletAddress)
      .then((res) => {
        const data = (res.data?.body ?? []).map((item: any) => ({
          tokenId: Number(item.tokenId),
          usedAmount: Number(item.usedAmount ?? item.amount ?? 0),
          usedAt: item.usedAt ?? item.timestamp ?? "",
          txHash: item.txHash ?? "",
        }));
        setRecords(data);
      })
      .catch((err) => {
        setToast(err?.response?.data?.message ?? "사용 내역을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-v-text">사용 내역</h1>
        {records.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
            {records.length}건
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 px-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor" className="w-16 h-16 text-v-border mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-v-textMuted text-sm">사용 내역이 없습니다</p>
        </div>
      ) : (
        <div className="px-6 mt-4 space-y-2">
          {records.map((rec, idx) => (
            <div
              key={`${rec.tokenId}-${idx}`}
              className="bg-v-surface rounded-v-lg px-4 py-3.5 shadow-v-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-v-text">
                    Token #{rec.tokenId}
                  </p>
                  <p className="text-xs text-v-textMuted mt-0.5">{formatDate(rec.usedAt)}</p>
                </div>
                <p className="text-base font-bold text-v-accent">
                  -{rec.usedAmount.toLocaleString("ko-KR")}원
                </p>
              </div>
              {rec.txHash && (
                <p className="text-[10px] text-v-textMuted font-mono mt-1.5 truncate">
                  {rec.txHash}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast} type="error" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
