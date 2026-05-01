import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VoucherBottomNav from "../../components/VoucherBottomNav";
import VoucherHome from "./VoucherHome";
import VoucherList from "./VoucherList";
import VoucherDetail from "./VoucherDetail";
import VoucherScan from "./VoucherScan";
import VoucherBox from "./VoucherBox";

function Voucher() {
  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans">
      <div className="h-full overflow-y-auto pb-16">
        <Routes>
          <Route path="/home" element={<VoucherHome />} />
          <Route path="/list" element={<VoucherList />} />
          <Route path="/list/:id" element={<VoucherDetail />} />
          <Route path="/scan" element={<VoucherScan />} />
          <Route path="/box" element={<VoucherBox />} />
          <Route path="*" element={<Navigate to="/voucher/home" replace />} />
        </Routes>
      </div>
      <VoucherBottomNav />
    </div>
  );
}

export default Voucher;
