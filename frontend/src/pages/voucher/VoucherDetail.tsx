import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import { useVoucherContract } from "../../services/web3/useVoucherContract";
import { logVoucherUseWithRetry } from "../../services/voucherApi";
import { CATEGORY_ICON, CATEGORY_LABEL, STATUS_LABEL } from "../../types/voucher";
import Toast from "../../components/Toast";

export default function VoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const { vouchers, loading, error, fetchVouchers, invalidateCache } = useVoucherList();
  const { executeUseVoucher } = useVoucherContract();

  const [amountInput, setAmountInput] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const [showAmountForm, setShowAmountForm] = useState(false);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  const voucher = vouchers.find((v) => v.tokenId === Number(id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-v-textMuted text-sm">{error}</p>
        <button
          onClick={() => walletAddress && fetchVouchers(walletAddress)}
          className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-v-textMuted">바우처를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isActive = voucher.status === "active";
  const formattedAmount = voucher.remainingAmount.toLocaleString("ko-KR") + "원";
  const shortAddress = voucher.tokenAddress
    ? `${voucher.tokenAddress.slice(0, 8)}...${voucher.tokenAddress.slice(-4)}`
    : `Token #${voucher.tokenId}`;

  const handleUse = async () => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      showToast("사용 금액을 올바르게 입력해주세요.");
      return;
    }
    if (amount > voucher.remainingAmount) {
      showToast(`잔액(${voucher.remainingAmount.toLocaleString("ko-KR")}원)을 초과할 수 없습니다.`);
      return;
    }
    if (!walletAddress) {
      showToast("지갑 주소를 확인할 수 없습니다.");
      return;
    }

    setTxLoading(true);
    try {
      const txHash = await executeUseVoucher(voucher.tokenId, amount);

      // 백엔드 재시도 로그
      try {
        await logVoucherUseWithRetry({
          tokenId: voucher.tokenId,
          merchantWallet: walletAddress,
          usedAmount: amount,
          txHash,
        });
      } catch {
        showToast("결제 완료 (로그 저장 지연 중)", "info");
      }

      showToast(`${amount.toLocaleString("ko-KR")}원 사용 완료!`, "success");
      invalidateCache(walletAddress);
      setShowAmountForm(false);
      setAmountInput("");
      // 목록 갱신
      setTimeout(() => fetchVouchers(walletAddress), 500);
    } catch (err: any) {
      showToast(err?.message ?? "바우처 사용 중 오류가 발생했습니다.");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/voucher/list")}
          className="text-v-text p-0.5 -ml-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">바우처 상세</h1>
      </div>

      {/* 카드 */}
      <div
        className="mx-6 mt-4 rounded-v-lg p-6 relative overflow-hidden"
        style={{
          background: isActive
            ? "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)"
            : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }}
        />
        <p className="text-xs text-white/75 font-medium">{voucher.name}</p>
        <p className="text-[30px] font-bold text-white mt-2 tracking-tight">{formattedAmount}</p>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
            {STATUS_LABEL[voucher.status]}
          </span>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <span className="font-mono text-[11px] text-white/60">{shortAddress}</span>
          <span className="text-xs text-white/75">~{voucher.expiresAt}</span>
        </div>
      </div>

      {/* QR 코드 섹션 (사용 가능한 경우만) */}
      {isActive && (
        <div className="mt-5 flex flex-col items-center">
          <p className="text-xs text-v-textMuted mb-3">QR 코드로 결제하세요</p>
          <div className="w-40 h-40 bg-v-surface rounded-v-md shadow-v-sm border border-v-border flex items-center justify-center p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="5" y="5" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="4" />
              <rect x="13" y="13" width="14" height="14" fill="#0F172A" />
              <rect x="65" y="5" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="4" />
              <rect x="73" y="13" width="14" height="14" fill="#0F172A" />
              <rect x="5" y="65" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="4" />
              <rect x="13" y="73" width="14" height="14" fill="#0F172A" />
              <rect x="42" y="5" width="8" height="8" fill="#0F172A" />
              <rect x="52" y="5" width="8" height="8" fill="#0F172A" />
              <rect x="42" y="15" width="8" height="8" fill="#0F172A" />
              <rect x="52" y="25" width="8" height="8" fill="#0F172A" />
              <rect x="42" y="42" width="8" height="8" fill="#0F172A" />
              <rect x="55" y="42" width="8" height="8" fill="#0F172A" />
              <rect x="68" y="42" width="8" height="8" fill="#0F172A" />
              <rect x="81" y="42" width="8" height="8" fill="#0F172A" />
              <rect x="42" y="55" width="8" height="8" fill="#0F172A" />
              <rect x="55" y="68" width="8" height="8" fill="#0F172A" />
              <rect x="68" y="55" width="8" height="8" fill="#0F172A" />
              <rect x="81" y="68" width="8" height="8" fill="#0F172A" />
              <rect x="42" y="81" width="8" height="8" fill="#0F172A" />
              <rect x="55" y="81" width="8" height="8" fill="#0F172A" />
              <rect x="68" y="81" width="8" height="8" fill="#0F172A" />
              <rect x="81" y="81" width="8" height="8" fill="#0F172A" />
            </svg>
          </div>
          <p className="text-[11px] text-v-textMuted mt-2 font-mono">{shortAddress}</p>
        </div>
      )}

      {/* 바우처 정보 */}
      <div className="px-6 mt-5 space-y-2">
        {[
          ["발급처", voucher.issuedBy],
          ["유효기간", voucher.expiresAt],
          ["카테고리", `${CATEGORY_ICON[voucher.category]} ${CATEGORY_LABEL[voucher.category]}`],
          ...(voucher.allowedCategories.length > 0
            ? [["허용 가맹점", voucher.allowedCategories.join(", ")]]
            : []),
          ["원래 금액", `${voucher.amount.toLocaleString("ko-KR")}원`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm"
          >
            <span className="text-sm text-v-textMuted">{label}</span>
            <span className="text-sm font-medium text-v-text">{value}</span>
          </div>
        ))}
      </div>

      {/* 사용하기 버튼 */}
      {isActive && (
        <div className="px-6 mt-5 pb-6">
          {!showAmountForm ? (
            <button
              onClick={() => setShowAmountForm(true)}
              className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors"
            >
              사용하기
            </button>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-v-text block">사용 금액</label>
              <div className="relative">
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="금액 입력"
                  min={1}
                  max={voucher.remainingAmount}
                  className="w-full px-4 py-3 pr-10 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-v-textMuted">원</span>
              </div>
              <p className="text-xs text-v-textMuted">
                최대 {voucher.remainingAmount.toLocaleString("ko-KR")}원
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAmountForm(false); setAmountInput(""); }}
                  className="flex-1 py-3.5 rounded-v-lg border border-v-border text-v-textMuted font-semibold text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUse}
                  disabled={txLoading}
                  className="flex-1 py-3.5 rounded-v-lg bg-v-accent text-white font-semibold text-sm shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {txLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : "확인"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
