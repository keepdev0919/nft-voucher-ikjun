import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVoucherContract } from "../../services/web3/useVoucherContract";
import { logVoucherUseWithRetry } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

interface VoucherVerifyInfo {
  tokenId: number;
  ownerName: string;
  amount: number;
  expiresAt: string;
  programName: string;
}

export default function MerchantVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletAddress } = useWallet();
  const { executeUseVoucher } = useVoucherContract();

  const info: VoucherVerifyInfo = location.state?.voucherInfo ?? {};

  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const [done, setDone] = useState(false);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handlePay = async () => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      showToast("결제 금액을 올바르게 입력해주세요.");
      return;
    }
    if (amount > info.amount) {
      showToast(`잔액(${info.amount.toLocaleString("ko-KR")}원)을 초과할 수 없습니다.`);
      return;
    }
    if (!walletAddress) {
      showToast("지갑 주소를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    setLoading(true);
    try {
      const txHash = await executeUseVoucher(info.tokenId, amount);

      // 컨트랙트 성공 → 백엔드 로그 재시도
      try {
        await logVoucherUseWithRetry({
          tokenId: info.tokenId,
          merchantWallet: walletAddress,
          usedAmount: amount,
          txHash,
        });
      } catch {
        // 백엔드 실패해도 컨트랙트는 성공한 것이므로 성공 처리
        showToast("결제 완료 (로그 저장 지연 중)", "info");
      }

      setDone(true);
      showToast(`${amount.toLocaleString("ko-KR")}원 결제 완료!`, "success");
    } catch (err: any) {
      showToast(err?.message ?? "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!info.tokenId) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6">
        <p className="text-v-textMuted text-sm">바우처 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate("/merchant/home")}
          className="mt-4 px-5 py-2.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-medium"
        >
          스캔으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/home")} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">결제 처리</h1>
      </div>

      {/* 바우처 정보 카드 */}
      <div
        className="mx-6 mt-4 rounded-v-lg p-6 relative overflow-hidden"
        style={{ background: done ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
      >
        <div className="absolute rounded-full pointer-events-none" style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }} />
        <p className="text-xs text-white/70">{info.programName}</p>
        <p className="text-[28px] font-bold text-white mt-1 tracking-tight">
          {info.amount.toLocaleString("ko-KR")}원
        </p>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-white/70">소유자: <span className="text-white font-medium">{info.ownerName}</span></p>
          <p className="text-xs text-white/70">유효기간: <span className="text-white font-medium">{info.expiresAt}</span></p>
          <p className="text-xs text-white/70">Token ID: <span className="text-white font-mono">{info.tokenId}</span></p>
        </div>
        {done && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            <span className="text-white text-xs font-semibold">결제 완료</span>
          </div>
        )}
      </div>

      {!done && (
        <>
          {/* 금액 입력 */}
          <div className="px-6 mt-5">
            <label className="text-sm font-semibold text-v-text block mb-2">결제 금액</label>
            <div className="relative">
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="금액 입력"
                min={1}
                max={info.amount}
                className="w-full px-4 py-3 pr-10 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-v-textMuted">원</span>
            </div>
            <p className="text-xs text-v-textMuted mt-1.5">
              최대 {info.amount.toLocaleString("ko-KR")}원
            </p>
          </div>

          {/* 결제 버튼 */}
          <div className="px-6 mt-5 pb-4">
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  처리 중...
                </>
              ) : "결제하기"}
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="px-6 mt-5 pb-4">
          <button
            onClick={() => navigate("/merchant/home")}
            className="w-full py-4 rounded-v-lg bg-v-accentLight text-v-accent font-semibold text-[15px] transition-colors"
          >
            새 결제 처리
          </button>
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
