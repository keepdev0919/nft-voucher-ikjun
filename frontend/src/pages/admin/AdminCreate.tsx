import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherContract } from "../../services/web3/useVoucherContract";
import { createProgram } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

const CATEGORIES = ["식비", "교통", "도서", "의료", "기타"];

export default function AdminCreate() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const { createVoucherProgram } = useVoucherContract();

  const [form, setForm] = useState({
    programId: "",
    name: "",
    amount: "",
    expiryDate: "",
    totalSupply: "",
    category: "식비",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.programId || !form.name || !form.amount || !form.expiryDate || !form.totalSupply) {
      showToast("모든 항목을 입력해주세요.");
      return;
    }
    if (!walletAddress) {
      showToast("지갑 주소를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const programId = Number(form.programId);
    const amount = Number(form.amount);
    const totalSupply = Number(form.totalSupply);
    const expiryTimestamp = Math.floor(new Date(form.expiryDate).getTime() / 1000);

    if (isNaN(programId) || programId <= 0) { showToast("유효한 프로그램 ID를 입력해주세요."); return; }
    if (isNaN(amount) || amount <= 0) { showToast("유효한 금액을 입력해주세요."); return; }
    if (isNaN(totalSupply) || totalSupply <= 0) { showToast("유효한 발행 수량을 입력해주세요."); return; }
    if (isNaN(expiryTimestamp)) { showToast("유효한 만료일을 선택해주세요."); return; }

    setLoading(true);
    try {
      // 1) 컨트랙트 트랜잭션
      await createVoucherProgram(programId, form.name, amount, expiryTimestamp, totalSupply, form.category);

      // 2) 백엔드 저장
      await createProgram({
        programId,
        name: form.name,
        amount,
        expiryDate: form.expiryDate,
        totalSupply,
        category: form.category,
        issuerWallet: walletAddress,
      });

      showToast("프로그램이 생성되었습니다!", "success");
      setTimeout(() => navigate("/admin/home"), 1500);
    } catch (err: any) {
      showToast(err?.message ?? "프로그램 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate("/admin/home")} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">바우처 프로그램 생성</h1>
      </div>

      {/* 폼 */}
      <div className="px-6 mt-5 space-y-4 pb-6">
        {[
          { label: "프로그램 ID", field: "programId" as const, type: "number", placeholder: "예: 1" },
          { label: "프로그램 이름", field: "name" as const, type: "text", placeholder: "예: 청년 식비 지원 바우처" },
          { label: "바우처 금액 (원)", field: "amount" as const, type: "number", placeholder: "예: 50000" },
          { label: "총 발행 수량", field: "totalSupply" as const, type: "number", placeholder: "예: 100" },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <label className="text-sm font-semibold text-v-text block mb-1.5">{label}</label>
            <input
              type={type}
              value={form[field]}
              onChange={handleChange(field)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효기간</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={handleChange("expiryDate")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">카테고리</label>
          <select
            value={form.category}
            onChange={handleChange("category")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              처리 중...
            </>
          ) : "프로그램 생성"}
        </button>
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
