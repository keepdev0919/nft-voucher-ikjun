import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast";
import { addMockVoucher } from "../../services/mockVoucherStore";
import { Voucher } from "../../types/voucher";

interface Program {
  id: number;
  name: string;
  amount: number;
  totalSupply: number;
  remaining: number;
  expiryDate: string;
  category: string;
  issuer: string;
}

const MOCK_PROGRAMS: Program[] = [
  {
    id: 1,
    name: "청년 식비 지원",
    amount: 50000,
    totalSupply: 100,
    remaining: 73,
    expiryDate: "2026-08-31",
    category: "일반 음식점",
    issuer: "서울시 청년지원센터",
  },
  {
    id: 2,
    name: "문화생활 바우처",
    amount: 30000,
    totalSupply: 50,
    remaining: 12,
    expiryDate: "2026-07-15",
    category: "영화관",
    issuer: "문화체육관광부",
  },
  {
    id: 3,
    name: "지역 음식점 할인권",
    amount: 20000,
    totalSupply: 200,
    remaining: 156,
    expiryDate: "2026-09-30",
    category: "일반 음식점",
    issuer: "강남구청",
  },
];

const CATEGORY_ICON: Record<string, string> = {
  "일반 음식점": "🍽️",
  "영화관": "🎬",
};

const CATEGORY_TO_TYPE: Record<string, Voucher["category"]> = {
  "일반 음식점": "food",
  "영화관": "other",
};

export default function VoucherProgramList() {
  const navigate = useNavigate();
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const handleApply = (program: Program) => {
    if (applied.has(program.id)) return;
    setApplied((prev) => new Set(prev).add(program.id));

    addMockVoucher({
      tokenId: Date.now(),
      name: program.name,
      category: CATEGORY_TO_TYPE[program.category] ?? "other",
      amount: program.amount,
      remainingAmount: program.amount,
      status: "active",
      expiresAt: program.expiryDate,
      issuedBy: program.issuer,
      allowedCategories: [program.category],
      tokenAddress: "",
    });

    setToast(`"${program.name}" 신청 완료! 내 바우처에서 확인하세요.`);
  };

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6">
        <h1 className="text-[20px] font-bold text-v-text">바우처 프로그램</h1>
        <p className="text-xs text-v-textMuted mt-0.5">신청 가능한 바우처 목록입니다</p>
      </div>

      {/* 목록 */}
      <div className="px-6 mt-4 space-y-3">
        {MOCK_PROGRAMS.map((program) => {
          const isApplied = applied.has(program.id);
          const usageRate = Math.round(((program.totalSupply - program.remaining) / program.totalSupply) * 100);

          return (
            <div
              key={program.id}
              className="bg-v-surface rounded-v-lg px-4 py-4 shadow-v-sm"
            >
              {/* 상단: 카테고리 + 발급기관 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
                  {CATEGORY_ICON[program.category]} {program.category}
                </span>
                <span className="text-[10px] text-v-textMuted">{program.issuer}</span>
              </div>

              {/* 프로그램 이름 */}
              <p className="text-base font-bold text-v-text">{program.name}</p>

              {/* 금액 */}
              <p className="text-[22px] font-bold text-v-accent mt-1">
                {program.amount.toLocaleString("ko-KR")}원
              </p>

              {/* 유효기간 */}
              <p className="text-xs text-v-textMuted mt-1">
                유효기간 ~{program.expiryDate}
              </p>

              {/* 잔여 수량 바 */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-v-textMuted mb-1">
                  <span>잔여 수량</span>
                  <span>{program.remaining} / {program.totalSupply}</span>
                </div>
                <div className="h-1.5 rounded-full bg-v-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-v-accent"
                    style={{ width: `${100 - usageRate}%` }}
                  />
                </div>
              </div>

              {/* 신청 버튼 */}
              <button
                onClick={() => handleApply(program)}
                disabled={isApplied || program.remaining === 0}
                className={`w-full mt-3 py-3 rounded-v-md text-sm font-semibold transition-colors ${
                  isApplied
                    ? "bg-v-surface2 text-v-textMuted cursor-default"
                    : program.remaining === 0
                    ? "bg-v-surface2 text-v-textMuted cursor-default"
                    : "bg-v-accent text-white active:bg-v-accentHover"
                }`}
              >
                {isApplied ? "신청 완료" : program.remaining === 0 ? "마감" : "신청하기"}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <Toast message={toast} type="success" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
