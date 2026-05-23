import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrGenerator from "../../components/QrGenerator";
import Toast from "../../components/Toast";
import {
  createPaymentSession,
  getPaymentStatus,
  PaymentSessionResponse,
  PaymentStatusResponse,
} from "../../services/voucherApi";

/**
 * 가맹점이 결제 받기 위해 QR을 생성하는 화면 (신규 흐름).
 *
 * 상태 머신:
 *   input → qr → completed | expired | error
 *
 * - input: 금액 입력 후 createPaymentSession 호출 → QR 표시
 * - qr: QR + deadline 카운트다운 + 2초 간격 폴링으로 status 감시
 * - completed: 결제 완료 (txHash 일부 표시)
 * - expired: deadline 만료
 * - error: 네트워크 오류 / 결제 취소
 *
 * 폴링은 phase === "qr" 일 때만 활성화되며, COMPLETED/EXPIRED/CANCELED 응답을 받으면
 * 즉시 해당 phase로 전환되어 자동 종료된다. 네트워크 실패 시 4초 backoff.
 */

const MAX_AMOUNT = 1_000_000;
const POLL_INTERVAL_MS = 2000;
const POLL_BACKOFF_MS = 4000;

type Phase = "input" | "qr" | "completed" | "expired" | "error";

function formatMMSS(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function maskTxHash(hash: string | null): string {
  if (!hash) return "-";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export default function MerchantPaymentRequest() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("input");
  const [amountInput, setAmountInput] = useState<string>("");
  const [session, setSession] = useState<PaymentSessionResponse | null>(null);
  const [result, setResult] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [toast, setToast] = useState<string | null>(null);

  // ── 카운트다운 (qr phase) ───────────────────────────────────
  useEffect(() => {
    if (phase !== "qr") return;
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const secondsLeft = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, session.deadline - now);
  }, [session, now]);

  // 클라이언트 측 만료 감지 — 백엔드 폴링과 별개로, 시계가 deadline 넘어가면 즉시 expired 전환.
  // (백엔드가 같은 결과를 늦게 돌려줄 수 있어 UI 반응성 확보 차원)
  useEffect(() => {
    if (phase !== "qr" || !session) return;
    if (secondsLeft <= 0) {
      setPhase("expired");
    }
  }, [phase, session, secondsLeft]);

  // ── 폴링 (qr phase) ───────────────────────────────────────
  useEffect(() => {
    if (phase !== "qr" || !session) return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const status = await getPaymentStatus(session.paymentId);
        if (cancelled) return;
        if (status.status === "COMPLETED") {
          setResult(status);
          setPhase("completed");
          return;
        }
        if (status.status === "EXPIRED") {
          setPhase("expired");
          return;
        }
        if (status.status === "CANCELED") {
          setError("결제가 취소되었습니다.");
          setPhase("error");
          return;
        }
        // PENDING → 계속 폴링
        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelled) return;
        // 네트워크 오류 — backoff 후 재시도. 사용자에게 노출하지 않음.
        timer = window.setTimeout(poll, POLL_BACKOFF_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, session]);

  // ── 핸들러 ────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast("올바른 금액을 입력해주세요.");
      return;
    }
    if (!Number.isInteger(amount)) {
      setToast("금액은 정수로 입력해주세요.");
      return;
    }
    if (amount > MAX_AMOUNT) {
      setToast(`최대 ${MAX_AMOUNT.toLocaleString("ko-KR")}원까지 가능합니다.`);
      return;
    }

    setSubmitting(true);
    try {
      const s = await createPaymentSession({ amount });
      setSession(s);
      setResult(null);
      setError("");
      setNow(Math.floor(Date.now() / 1000));
      setPhase("qr");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "결제 세션 생성에 실패했습니다.";
      setError(msg);
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }, [amountInput]);

  const handleRetry = useCallback(() => {
    setSession(null);
    setResult(null);
    setError("");
    setPhase("input");
  }, []);

  const handleCancel = useCallback(() => {
    // 백엔드에 별도 cancel API가 없으므로 클라이언트에서만 닫고 홈으로.
    // 폴링 cleanup은 phase 변경으로 자연스럽게 처리됨.
    navigate("/merchant/home");
  }, [navigate]);

  // ── QR payload (가맹점 → 사용자) ───────────────────────────
  const qrPayload = useMemo(() => {
    if (!session) return "";
    return JSON.stringify({
      merchantWallet: session.merchantWallet,
      amount: session.amount,
      paymentId: session.paymentId,
      deadline: session.deadline,
    });
  }, [session]);

  // ── 렌더 ──────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#0D0D18] flex flex-col">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 pt-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/merchant/home")}
          className="text-white p-0.5 -ml-0.5"
          aria-label="뒤로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">결제 받기</h1>
          <p className="text-[13px] text-white/45 mt-0.5">
            {phase === "input" && "결제 금액을 입력하세요"}
            {phase === "qr" && "사용자가 QR을 스캔하면 자동으로 결제됩니다"}
            {phase === "completed" && "결제가 완료되었습니다"}
            {phase === "expired" && "결제 시간이 만료되었습니다"}
            {phase === "error" && "오류가 발생했습니다"}
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 px-6 mt-6 pb-8">
        {phase === "input" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-white/60 font-medium">금액</span>
              <div className="mt-1.5 relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_AMOUNT}
                  step={1}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/15 rounded-v-md px-4 py-4 text-white text-2xl font-bold text-right placeholder-white/20 focus:outline-none focus:border-v-accent transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm pointer-events-none">
                  원
                </span>
              </div>
              <span className="text-[11px] text-white/35 mt-1.5 block">
                최대 {MAX_AMOUNT.toLocaleString("ko-KR")}원
              </span>
            </label>

            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || !amountInput}
              className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {submitting ? "생성 중..." : "QR 생성"}
            </button>
          </div>
        )}

        {phase === "qr" && session && (
          <div className="flex flex-col items-center">
            {/* 금액 큰 표시 */}
            <p className="text-white/60 text-xs">결제 금액</p>
            <p className="text-white text-4xl font-bold mt-1 tracking-tight">
              {session.amount.toLocaleString("ko-KR")}원
            </p>

            {/* QR */}
            <div className="mt-5">
              <QrGenerator payload={qrPayload} size={280} />
            </div>

            {/* 남은 시간 */}
            <div className="mt-5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 ${secondsLeft <= 60 ? "text-amber-300" : "text-white/60"}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span
                className={`font-mono text-sm font-semibold ${
                  secondsLeft <= 60 ? "text-amber-300" : "text-white/80"
                }`}
              >
                {formatMMSS(secondsLeft)}
              </span>
            </div>

            {/* 대기 안내 */}
            <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              사용자의 결제 대기 중...
            </div>

            {/* 취소 */}
            <button
              type="button"
              onClick={handleCancel}
              className="mt-8 w-full py-3 rounded-v-md bg-white/10 text-white/70 text-sm font-medium active:bg-white/15 transition-colors"
            >
              취소
            </button>
          </div>
        )}

        {phase === "completed" && session && (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-10 h-10 text-emerald-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-white text-2xl font-bold mt-5">결제 완료!</p>
            <p className="text-white/60 text-xs mt-1">감사합니다</p>

            <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-v-md px-5 py-4">
              <div className="flex justify-between items-baseline">
                <span className="text-white/60 text-xs">결제 금액</span>
                <span className="text-white text-xl font-bold">
                  {session.amount.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="h-px bg-white/10 my-3" />
              <div className="flex justify-between items-baseline">
                <span className="text-white/60 text-xs">트랜잭션</span>
                <span className="text-white/80 text-xs font-mono">
                  {maskTxHash(result?.txHash ?? null)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/merchant/home")}
              className="mt-6 w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
            >
              처음으로
            </button>
          </div>
        )}

        {phase === "expired" && (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-amber-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-white text-xl font-bold mt-5">
              결제 시간이 만료되었습니다.
            </p>
            <p className="text-white/60 text-xs mt-2">
              다시 시도하려면 아래 버튼을 눌러주세요.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-8 w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-red-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-white text-xl font-bold mt-5">
              {error || "오류가 발생했습니다."}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-8 w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </div>
  );
}
