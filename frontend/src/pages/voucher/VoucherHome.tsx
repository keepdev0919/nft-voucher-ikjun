import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import VoucherListItem from "../../components/voucher/VoucherListItem";
import PendingPaymentModal from "../../components/PendingPaymentModal";
import Toast from "../../components/Toast";
import {
  getPendingUseRequests,
  UseVoucherPrepareResponse,
} from "../../services/voucherApi";

// 폴링 주기 — 5초. 백오프는 두지 않는다(현재 백엔드 부하 미미하고,
// 데모 환경에서 빠른 응답성이 더 중요). 401은 axios 인터셉터가 처리하므로
// 여기서는 silent fail 처리하고 다음 tick에서 재시도한다.
const POLL_INTERVAL_MS = 5000;

export default function VoucherHome() {
  const navigate = useNavigate();
  const { walletAddress, nickname, isAuthenticated } = useWallet();
  const { vouchers, loading, error, fetchVouchers, refetch } = useVoucherList();

  const [currentRequest, setCurrentRequest] =
    useState<UseVoucherPrepareResponse | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  // 결제 요청 폴링 — 인증/지갑 모두 있고 현재 모달에 표시 중인 요청이 없을 때만 동작.
  // 모달이 열려 있는 동안엔 새 요청을 덮어쓰지 않는다 (사용자 입력 보호).
  useEffect(() => {
    if (!isAuthenticated || !walletAddress) return;
    if (currentRequest) return; // 모달이 떠있는 동안엔 폴링 중단

    let cancelled = false;
    let timerId: number | null = null;

    const poll = async () => {
      try {
        const pending = await getPendingUseRequests();
        if (cancelled) return;
        if (pending.length > 0) {
          // 가장 오래된(첫 번째) 요청을 우선 표시. 백엔드가 정렬 보장 안 하면
          // deadline 기준 정렬을 시도 — 만료가 가까운 것부터.
          const sorted = [...pending].sort((a, b) => a.deadline - b.deadline);
          setCurrentRequest(sorted[0]);
          return; // 모달이 열리면 setState로 effect가 다시 돌아 cleanup된다.
        }
      } catch (e) {
        // 401은 axios 인터셉터가 /login으로 보내므로 여기선 무시.
        // 그 외 네트워크 오류도 silent fail — 사용자에게 노출하면 노이즈.
      }
      if (!cancelled) {
        timerId = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [isAuthenticated, walletAddress, currentRequest]);

  const activeVouchers = vouchers.filter((v) => v.status === "ACTIVE");
  const total = activeVouchers.reduce((sum, v) => sum + v.currentValue, 0);

  const handlePaymentSuccess = () => {
    setCurrentRequest(null);
    setToast({ message: "결제가 완료되었습니다!", type: "success" });
    refetch();
  };

  const handlePaymentDismiss = () => {
    // 거부/X 클릭 — 백엔드 cancel API가 없으므로 상태만 닫는다.
    // 다음 폴링 tick에서 같은 요청이 다시 떠오를 수 있음 (deadline 만료 전까지).
    setCurrentRequest(null);
  };

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

      {/* 메인 액션: 결제하기 (QR 스캔) — 신규 흐름 */}
      <div className="px-6 mt-3">
        <button
          onClick={() => navigate("/voucher/pay")}
          className="w-full py-4 rounded-v-md bg-v-accent text-white text-sm font-bold active:bg-v-accentHover transition-colors flex items-center justify-center gap-2 shadow-v-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
            />
          </svg>
          결제하기 (QR 스캔)
        </button>
      </div>

      {/* 빠른 액세스 */}
      <div className="px-6 mt-3 flex gap-3">
        <button
          onClick={() => navigate("/voucher/programs")}
          className="flex-1 py-3.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-semibold active:bg-v-accent/20 transition-colors"
        >
          둘러보기
        </button>
        <button
          onClick={() => navigate("/voucher/list")}
          className="flex-1 py-3.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-semibold active:bg-v-accent/20 transition-colors"
        >
          내 바우처
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
            <p className="text-v-textMuted text-sm">
              보유한 바우처가 없습니다. 기관에서 발급을 기다려주세요.
            </p>
          </div>
        ) : (
          <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
            {vouchers.slice(0, 3).map((v) => (
              <VoucherListItem
                key={v.id}
                voucher={v}
                onClick={() => navigate(`/voucher/list/${v.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 결제 요청 모달 */}
      {currentRequest && walletAddress && (
        <PendingPaymentModal
          request={currentRequest}
          walletAddress={walletAddress}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
      )}

      {/* 토스트 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
