import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  UseVoucherPrepareResponse,
  executeUseVoucher,
} from "../services/voucherApi";

interface PendingPaymentModalProps {
  request: UseVoucherPrepareResponse;
  walletAddress: string;
  onSuccess: () => void;
  onDismiss: () => void;
}

type Phase = "idle" | "signing" | "executing";

/**
 * deadline은 백엔드에서 epoch seconds (UNIX timestamp, EIP-712 표준)로 전달된다.
 * Date.now() / 1000 과 비교하여 남은 시간을 계산.
 */
function formatRemaining(secondsLeft: number): string {
  if (secondsLeft <= 0) return "00:00";
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PendingPaymentModal({
  request,
  walletAddress,
  onSuccess,
  onDismiss,
}: PendingPaymentModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  // deadline 카운트다운 — 1초마다 현재 시각만 갱신해서 남은 초를 재계산한다.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsLeft = useMemo(() => {
    return Math.max(0, request.deadline - now);
  }, [request.deadline, now]);

  const expired = secondsLeft <= 0;
  const busy = phase !== "idle";

  const handleSignAndPay = useCallback(async () => {
    setError(null);
    const eth = (window as any).ethereum;
    if (!eth) {
      setError("MetaMask가 설치되어 있지 않습니다.");
      return;
    }

    let signature: string;
    try {
      setPhase("signing");
      signature = await eth.request({
        method: "eth_signTypedData_v4",
        params: [walletAddress, JSON.stringify(request.eip712)],
      });
    } catch (e: any) {
      // MetaMask reject 코드 4001 = User rejected request
      if (e?.code === 4001) {
        setError("사용자가 서명을 취소했습니다.");
      } else {
        setError(e?.message ?? "서명 중 오류가 발생했습니다.");
      }
      setPhase("idle");
      return;
    }

    try {
      setPhase("executing");
      await executeUseVoucher(request.voucherId, {
        historyId: request.historyId,
        ownerSignature: signature,
      });
      // 성공 — 부모에서 토스트 표시 + 모달 닫기 + 목록 갱신
      onSuccess();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "결제 처리 중 오류가 발생했습니다."
      );
      setPhase("idle");
    }
  }, [request, walletAddress, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-payment-title"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!busy) onDismiss();
        }}
      />

      {/* card */}
      <div className="relative w-full max-w-sm bg-v-surface rounded-v-lg shadow-v-lg overflow-hidden">
        {/* header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-v-accentLight flex items-center justify-center text-v-accent">
            {/* card/payment icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
          </div>
          <div>
            <h2
              id="pending-payment-title"
              className="text-base font-bold text-v-text"
            >
              결제 요청
            </h2>
            <p className="text-[11px] text-v-textMuted mt-0.5">
              가맹점이 결제를 요청했습니다
            </p>
          </div>
        </div>

        <div className="h-px bg-v-border mx-5" />

        {/* body */}
        <div className="px-5 py-4">
          <p className="text-xs text-v-textMuted">가맹점</p>
          <p className="text-sm font-semibold text-v-text mt-0.5">
            {request.merchantNickname}
          </p>

          <p className="text-xs text-v-textMuted mt-3">바우처</p>
          <p className="text-sm font-semibold text-v-text mt-0.5">
            {request.programName}
          </p>

          <div className="mt-4 bg-v-surface2 rounded-v-md px-4 py-3.5 text-center">
            <p className="text-[11px] text-v-textMuted">결제 금액</p>
            <p className="text-[28px] font-bold text-v-accent tracking-tight mt-0.5">
              {request.amount.toLocaleString("ko-KR")}원
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-v-textMuted">유효시간</span>
            {expired ? (
              <span className="text-v-error font-semibold">만료된 요청입니다</span>
            ) : (
              <span
                className={`font-mono font-semibold ${
                  secondsLeft <= 60 ? "text-v-warning" : "text-v-text"
                }`}
              >
                {formatRemaining(secondsLeft)} 남음
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-v-sm px-3 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* buttons */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="flex-1 py-3 rounded-v-md bg-v-surface2 text-v-textSecondary text-sm font-semibold active:bg-v-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            거부
          </button>
          <button
            type="button"
            onClick={handleSignAndPay}
            disabled={busy || expired}
            className="flex-1 py-3 rounded-v-md bg-v-accent text-white text-sm font-semibold active:bg-v-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {phase === "signing" && (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                서명 대기 중...
              </>
            )}
            {phase === "executing" && (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                결제 처리 중...
              </>
            )}
            {phase === "idle" && (expired ? "만료됨" : "서명하고 결제")}
          </button>
        </div>
      </div>
    </div>
  );
}
