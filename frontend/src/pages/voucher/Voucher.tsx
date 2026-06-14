import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import VoucherBottomNav from "../../components/VoucherBottomNav";
import VoucherHome from "./VoucherHome";
import VoucherList from "./VoucherList";
import VoucherDetail from "./VoucherDetail";
import VoucherProgramList from "./VoucherProgramList";
import PendingPaymentModal from "../../components/PendingPaymentModal";
import Toast from "../../components/Toast";
import { useWallet } from "../../context/WalletContext";
import {
  getPendingUseRequests,
  UseVoucherPrepareResponse,
} from "../../services/voucherApi";

// 사용자 측 어느 페이지에 있든 결제 요청을 받기 위해 라우터 wrapper에서 폴링.
// (이전엔 VoucherHome에서만 폴링해 바우처 상세 화면에선 모달이 안 떴음.)
const POLL_INTERVAL_MS = 3000;

function Voucher() {
  const location = useLocation();
  const { walletAddress, isAuthenticated, logout } = useWallet();
  const [currentRequest, setCurrentRequest] =
    useState<UseVoucherPrepareResponse | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  // 사용자가 거부했거나 만료된 historyId는 더 이상 모달로 띄우지 않는다.
  // 백엔드에 PENDING cancel API가 없어 클라이언트에서 차단.
  const dismissedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !walletAddress) return;
    if (currentRequest) return; // 모달이 떠있는 동안 폴링 중단

    let cancelled = false;
    let timerId: number | null = null;

    const poll = async () => {
      try {
        const pending = await getPendingUseRequests();
        if (cancelled) return;
        const now = Math.floor(Date.now() / 1000);
        // 만료된 요청 + 이미 거부한 요청은 제외
        const valid = pending.filter(
          (p) => p.deadline > now && !dismissedRef.current.has(p.historyId)
        );
        if (valid.length > 0) {
          const sorted = [...valid].sort((a, b) => a.deadline - b.deadline);
          setCurrentRequest(sorted[0]);
          return;
        }
      } catch {
        // silent fail — 401은 axios 인터셉터가 처리
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
  }, [isAuthenticated, walletAddress, currentRequest, location.pathname]);

  const handlePaymentSuccess = () => {
    setCurrentRequest(null);
    setToast({ message: "결제가 완료되었습니다!", type: "success" });
  };

  const handlePaymentDismiss = () => {
    if (currentRequest) dismissedRef.current.add(currentRequest.historyId);
    setCurrentRequest(null);
  };

  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans">
      {/* 우상단 로그아웃 — 헤더 컴포넌트 없이 최소 침습으로 배치 */}
      <button
        type="button"
        onClick={logout}
        className="absolute top-3 right-4 z-20 text-xs text-v-textMuted hover:text-v-text active:text-v-accent transition-colors px-2 py-1"
        aria-label="로그아웃"
      >
        로그아웃
      </button>
      <div className="h-full overflow-y-auto pb-16">
        <Routes>
          <Route path="/home" element={<VoucherHome />} />
          <Route path="/programs" element={<VoucherProgramList />} />
          <Route path="/list" element={<VoucherList />} />
          <Route path="/list/:id" element={<VoucherDetail />} />
          <Route path="*" element={<Navigate to="/voucher/home" replace />} />
        </Routes>
      </div>
      <VoucherBottomNav />

      {currentRequest && walletAddress && (
        <PendingPaymentModal
          request={currentRequest}
          walletAddress={walletAddress}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
      )}
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

export default Voucher;
