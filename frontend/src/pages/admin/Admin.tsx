import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import AdminHome from "./AdminHome";
import AdminCreate from "./AdminCreate";
import AdminVerify from "./AdminVerify";
import { useWallet } from "../../context/WalletContext";

const NAV_ITEMS = [
  {
    label: "홈",
    path: "/admin/home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "프로그램 생성",
    path: "/admin/create",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    label: "검증",
    path: "/admin/verify",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

function AdminBottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-v-border flex z-10 max-w-[480px] mx-auto">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              active ? "text-v-accent" : "text-v-textMuted"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Admin() {
  const { logout } = useWallet();
  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans">
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
          <Route path="/home" element={<AdminHome />} />
          <Route path="/create" element={<AdminCreate />} />
          <Route path="/verify" element={<AdminVerify />} />
          <Route path="*" element={<Navigate to="/admin/home" replace />} />
        </Routes>
      </div>
      <AdminBottomNav />
    </div>
  );
}
