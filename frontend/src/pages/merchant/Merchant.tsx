import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import MerchantScan from "./MerchantScan";
import MerchantVerify from "./MerchantVerify";
import MerchantHistory from "./MerchantHistory";

const NAV_ITEMS = [
  {
    label: "스캔",
    path: "/merchant/home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
      </svg>
    ),
  },
  {
    label: "내역",
    path: "/merchant/history",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
];

function MerchantBottomNav() {
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

export default function Merchant() {
  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans">
      <div className="h-full overflow-y-auto pb-16">
        <Routes>
          <Route path="/home" element={<MerchantScan />} />
          <Route path="/verify" element={<MerchantVerify />} />
          <Route path="/history" element={<MerchantHistory />} />
          <Route path="*" element={<Navigate to="/merchant/home" replace />} />
        </Routes>
      </div>
      <MerchantBottomNav />
    </div>
  );
}
