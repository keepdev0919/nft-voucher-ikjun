import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "../../components/QrScanner";
import Toast from "../../components/Toast";
import { useWallet } from "../../context/WalletContext";
import {
  executeUseVoucher,
  getMyVouchersList,
  prepareUseVoucher,
  VoucherResponse,
} from "../../services/voucherApi";
import { getCategoryIcon } from "../../types/voucher";

/**
 * 사용자가 가맹점 QR을 스캔해 결제하는 화면 (신규 흐름).
 *
 * QR 페이로드:
 *   { merchantWallet, amount, paymentId, deadline }
 *
 * 상태 머신:
 *   scanning → select-voucher → signing → executing → done | error
 *
 * - scanning: 카메라 스캐너
 * - select-voucher: 결제 정보 카드 + 본인 ACTIVE 바우처 목록 (currentValue ≥ amount 만 선택 가능)
 * - signing: MetaMask EIP-712 서명 대기
 * - executing: 백엔드 executeUseVoucher 호출 중
 * - done: 결제 완료
 * - error: 실패 (사용자 거부, 만료, 잔액 부족 등)
 *
 * 마운트 시 본인 바우처 목록을 미리 로드 → 스캔 직후 즉시 선택 UI 노출 가능.
 */

type Phase =
  | "scanning"
  | "select-voucher"
  | "signing"
  | "executing"
  | "done"
  | "error";

interface PaymentQrPayload {
  merchantWallet: string;
  amount: number;
  paymentId: string;
  deadline: number;
}

function isValidPayload(obj: any): obj is PaymentQrPayload {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.merchantWallet === "string" &&
    obj.merchantWallet.startsWith("0x") &&
    typeof obj.amount === "number" &&
    obj.amount > 0 &&
    typeof obj.paymentId === "string" &&
    obj.paymentId.length > 0 &&
    typeof obj.deadline === "number" &&
    obj.deadline > 0
  );
}

function maskWallet(addr: string): string {
  if (!addr) return "-";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatMMSS(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VoucherPay() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [phase, setPhase] = useState<Phase>("scanning");
  const [paused, setPaused] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentQrPayload | null>(null);
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  // ── 본인 바우처 로드 (마운트 시 1회) ───────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    setVoucherLoading(true);
    getMyVouchersList(walletAddress)
      .then((list) => {
        if (cancelled) return;
        // ACTIVE + 잔액 > 0 만. 만료 여부는 prepareUseVoucher가 백엔드에서 최종 검증.
        const filtered = list.filter(
          (v) => v.status === "ACTIVE" && v.currentValue > 0
        );
        setVouchers(filtered);
      })
      .catch(() => {
        // 401은 인터셉터가 처리. 그 외는 select-voucher 단계에서 빈 목록으로 안내.
      })
      .finally(() => {
        if (!cancelled) setVoucherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  // ── 카운트다운 (select-voucher 단계) ───────────────────────
  useEffect(() => {
    if (phase !== "select-voucher") return;
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const secondsLeft = useMemo(() => {
    if (!paymentInfo) return 0;
    return Math.max(0, paymentInfo.deadline - now);
  }, [paymentInfo, now]);

  // ── 핸들러 ────────────────────────────────────────────────
  const handleScan = useCallback(
    (raw: string) => {
      if (paused) return;
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        setPaused(true);
        setToast("올바른 결제 QR이 아닙니다.");
        setTimeout(() => setPaused(false), 1000);
        return;
      }
      if (!isValidPayload(data)) {
        setPaused(true);
        setToast("결제 정보를 인식할 수 없습니다.");
        setTimeout(() => setPaused(false), 1000);
        return;
      }
      if (data.deadline < Math.floor(Date.now() / 1000)) {
        setPaused(true);
        setToast("만료된 결제 요청입니다.");
        setTimeout(() => setPaused(false), 1500);
        return;
      }
      setPaymentInfo(data);
      setPaused(true);
      setNow(Math.floor(Date.now() / 1000));
      setPhase("select-voucher");
    },
    [paused]
  );

  const handleScanError = useCallback((err: Error) => {
    if (/permission|denied|NotAllowed/i.test(err.message ?? "")) {
      setToast("카메라 권한이 필요합니다.");
    }
  }, []);

  const handlePay = useCallback(async () => {
    if (!paymentInfo || !walletAddress || selectedVoucherId == null) return;
    const selected = vouchers.find((v) => v.id === selectedVoucherId);
    if (!selected) {
      setError("바우처를 다시 선택해주세요.");
      setPhase("error");
      return;
    }
    if (selected.currentValue < paymentInfo.amount) {
      setError("선택한 바우처의 잔액이 부족합니다.");
      setPhase("error");
      return;
    }
    if (paymentInfo.deadline < Math.floor(Date.now() / 1000)) {
      setError("결제 요청이 만료되었습니다.");
      setPhase("error");
      return;
    }

    const eth = (window as any).ethereum;
    if (!eth) {
      setError("MetaMask가 설치되어 있지 않습니다.");
      setPhase("error");
      return;
    }

    try {
      setPhase("signing");
      const prep = await prepareUseVoucher(selected.id, {
        merchantWallet: paymentInfo.merchantWallet,
        amount: paymentInfo.amount,
        paymentId: paymentInfo.paymentId,
      });

      let signature: string;
      try {
        signature = await eth.request({
          method: "eth_signTypedData_v4",
          params: [walletAddress, JSON.stringify(prep.eip712)],
        });
      } catch (e: any) {
        if (e?.code === 4001) {
          setError("사용자가 서명을 취소했습니다.");
        } else {
          setError(e?.message ?? "서명 중 오류가 발생했습니다.");
        }
        setPhase("error");
        return;
      }

      setPhase("executing");
      await executeUseVoucher(selected.id, {
        historyId: prep.historyId,
        ownerSignature: signature,
      });
      setPhase("done");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "결제 처리에 실패했습니다.";
      setError(msg);
      setPhase("error");
    }
  }, [paymentInfo, walletAddress, selectedVoucherId, vouchers]);

  const handleRescan = useCallback(() => {
    setPaymentInfo(null);
    setSelectedVoucherId(null);
    setError("");
    setPaused(false);
    setPhase("scanning");
  }, []);

  // ── 렌더 ──────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-v-bg flex flex-col">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 pt-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/voucher/home")}
          className="text-v-text p-0.5 -ml-0.5"
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
          <h1 className="text-xl font-bold text-v-text">결제하기</h1>
          <p className="text-[13px] text-v-textMuted mt-0.5">
            {phase === "scanning" && "가맹점 QR을 스캔하세요"}
            {phase === "select-voucher" && "사용할 바우처를 선택하세요"}
            {phase === "signing" && "MetaMask에서 서명해주세요"}
            {phase === "executing" && "결제 처리 중입니다"}
            {phase === "done" && "결제가 완료되었습니다"}
            {phase === "error" && "결제에 실패했습니다"}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 mt-5 pb-8">
        {phase === "scanning" && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs">
              <QrScanner
                onScan={handleScan}
                onError={handleScanError}
                paused={paused}
                className="aspect-square"
              />
            </div>
            <p className="text-v-textMuted text-xs mt-5">
              QR 코드를 사각형 안에 맞춰주세요
            </p>
          </div>
        )}

        {phase === "select-voucher" && paymentInfo && (
          <div className="space-y-4">
            {/* 결제 정보 카드 */}
            <div
              className="rounded-v-lg p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              }}
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 140,
                  height: 140,
                  top: -36,
                  right: -36,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <p className="text-xs text-white/70 font-medium relative">결제 요청</p>
              <p className="text-[32px] font-bold text-white mt-1 tracking-tight relative">
                {paymentInfo.amount.toLocaleString("ko-KR")}원
              </p>
              <div className="mt-3 space-y-1 relative">
                <p className="text-xs text-white/70">
                  가맹점:{" "}
                  <span className="text-white font-mono">
                    {maskWallet(paymentInfo.merchantWallet)}
                  </span>
                </p>
                <p className="text-xs text-white/70">
                  남은 시간:{" "}
                  <span
                    className={`font-mono font-semibold ${
                      secondsLeft <= 60 ? "text-amber-200" : "text-white"
                    }`}
                  >
                    {formatMMSS(secondsLeft)}
                  </span>
                </p>
              </div>
            </div>

            {/* 바우처 선택 */}
            <div>
              <h2 className="text-sm font-semibold text-v-text mb-2">
                사용할 바우처
              </h2>

              {voucherLoading ? (
                <div className="bg-v-surface rounded-v-lg px-4 py-6 shadow-v-sm flex justify-center">
                  <span className="w-6 h-6 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="bg-v-surface rounded-v-lg px-4 py-6 shadow-v-sm text-center">
                  <p className="text-v-textMuted text-sm">
                    사용 가능한 바우처가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vouchers.map((v) => {
                    const insufficient = v.currentValue < paymentInfo.amount;
                    const selected = selectedVoucherId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={insufficient}
                        onClick={() => setSelectedVoucherId(v.id)}
                        className={`w-full text-left rounded-v-md px-4 py-3 border transition-colors flex items-center gap-3 ${
                          insufficient
                            ? "bg-v-surface2 border-v-border opacity-50 cursor-not-allowed"
                            : selected
                              ? "bg-v-accentLight border-v-accent"
                              : "bg-v-surface border-v-border active:bg-v-surface2"
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0" aria-hidden>
                          {getCategoryIcon(v.programCategory)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-v-text truncate">
                            {v.programName}
                          </p>
                          <p className="text-xs text-v-textMuted mt-0.5">
                            잔액 {v.currentValue.toLocaleString("ko-KR")}원
                          </p>
                        </div>
                        {insufficient && (
                          <span className="text-[11px] text-v-error font-semibold flex-shrink-0">
                            잔액 부족
                          </span>
                        )}
                        {selected && !insufficient && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-v-accent flex-shrink-0"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 결제 버튼 */}
            <button
              type="button"
              onClick={handlePay}
              disabled={selectedVoucherId == null || secondsLeft <= 0}
              className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondsLeft <= 0 ? "요청 만료됨" : "결제하기"}
            </button>

            <button
              type="button"
              onClick={handleRescan}
              className="w-full py-3 rounded-v-md bg-v-surface2 text-v-textSecondary text-sm font-medium active:bg-v-border transition-colors"
            >
              다시 스캔
            </button>
          </div>
        )}

        {(phase === "signing" || phase === "executing") && (
          <div className="flex flex-col items-center justify-center pt-16">
            <span className="w-12 h-12 border-4 border-v-border border-t-v-accent rounded-full animate-spin" />
            <p className="text-v-text font-semibold mt-5">
              {phase === "signing"
                ? "MetaMask에서 서명해주세요"
                : "결제 처리 중..."}
            </p>
            <p className="text-v-textMuted text-xs mt-2 text-center px-4">
              {phase === "signing"
                ? "MetaMask 팝업에서 거래 내용을 확인하고 서명해주세요."
                : "블록체인 트랜잭션이 처리되는 동안 잠시만 기다려주세요."}
            </p>
          </div>
        )}

        {phase === "done" && paymentInfo && (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-10 h-10 text-emerald-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-v-text text-2xl font-bold mt-5">결제 완료!</p>
            <p className="text-v-textMuted text-sm mt-2">
              {paymentInfo.amount.toLocaleString("ko-KR")}원 결제되었습니다
            </p>
            <button
              type="button"
              onClick={() => navigate("/voucher/home")}
              className="mt-8 w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
            >
              내 바우처로 돌아가기
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-v-error"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-v-text text-lg font-bold mt-5">결제 실패</p>
            <p className="text-v-textMuted text-sm mt-2 px-4">
              {error || "알 수 없는 오류가 발생했습니다."}
            </p>
            <div className="mt-8 w-full space-y-2">
              <button
                type="button"
                onClick={handleRescan}
                className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={() => navigate("/voucher/home")}
                className="w-full py-3 rounded-v-md bg-v-surface2 text-v-textSecondary text-sm font-medium active:bg-v-border transition-colors"
              >
                처음으로
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast} type="error" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
