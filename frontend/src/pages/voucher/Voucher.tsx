import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VoucherBottomNav from "../../components/VoucherBottomNav";
import VoucherHome from "./VoucherHome";
import VoucherList from "./VoucherList";
import VoucherDetail from "./VoucherDetail";
import VoucherProgramList from "./VoucherProgramList";
import VoucherPay from "./VoucherPay";
import { useWallet } from "../../context/WalletContext";

function Voucher() {
  const { logout } = useWallet();
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
          <Route path="/pay" element={<VoucherPay />} />
          <Route path="/programs" element={<VoucherProgramList />} />
          <Route path="/list" element={<VoucherList />} />
          <Route path="/list/:id" element={<VoucherDetail />} />
          <Route path="*" element={<Navigate to="/voucher/home" replace />} />
        </Routes>
      </div>
      <VoucherBottomNav />
    </div>
  );
}

export default Voucher;
