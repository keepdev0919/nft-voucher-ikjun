import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVoucherProgram } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

const CATEGORIES = ["일반 음식점", "영화관", "카페", "편의점"];

// datetime-local 값(YYYY-MM-DDTHH:mm)을 백엔드 LocalDateTime 호환 문자열로 변환.
// LocalDateTime은 타임존 없는 ISO이므로 초 단위까지 채워서 전달한다.
function toLocalDateTime(value: string): string {
  if (!value) return "";
  // datetime-local 입력은 "2026-05-22T14:30" 형태. 초가 없으면 ":00"을 붙인다.
  return value.length === 16 ? `${value}:00` : value;
}

export default function AdminCreate() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [form, setForm] = useState({
    name: "",
    description: "",
    maxValue: "",
    totalSupply: "",
    category: "일반 음식점",
    validFrom: "",
    validUntil: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.maxValue || !form.totalSupply || !form.validFrom || !form.validUntil) {
      showToast("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (!walletAddress) {
      showToast("지갑 주소를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const maxValue = Number(form.maxValue);
    const totalSupply = Number(form.totalSupply);

    if (isNaN(maxValue) || maxValue <= 0) { showToast("유효한 최대 금액을 입력해주세요."); return; }
    if (isNaN(totalSupply) || totalSupply <= 0) { showToast("유효한 발행 수량을 입력해주세요."); return; }

    const validFromIso = toLocalDateTime(form.validFrom);
    const validUntilIso = toLocalDateTime(form.validUntil);

    if (new Date(validFromIso).getTime() >= new Date(validUntilIso).getTime()) {
      showToast("유효 종료일은 시작일 이후여야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await createVoucherProgram({
        walletAddress,
        name: form.name,
        description: form.description || undefined,
        maxValue,
        totalSupply,
        category: form.category,
        validFrom: validFromIso,
        validUntil: validUntilIso,
      });

      showToast(`프로그램 #${res.id} "${res.name}" 생성 완료!`, "success");
      setTimeout(() => navigate("/admin/home"), 1500);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      showToast(backendMsg ?? err?.message ?? "프로그램 생성에 실패했습니다.");
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
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">프로그램 이름</label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="예: 청년 식비 지원 바우처"
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">
            설명 <span className="text-v-textMuted font-normal">(선택)</span>
          </label>
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            placeholder="프로그램에 대한 간단한 설명"
            rows={2}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">최대 금액 (원)</label>
          <input
            type="number"
            value={form.maxValue}
            onChange={handleChange("maxValue")}
            placeholder="예: 50000"
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">총 발행 수량</label>
          <input
            type="number"
            value={form.totalSupply}
            onChange={handleChange("totalSupply")}
            placeholder="예: 100"
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

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 시작일</label>
          <input
            type="datetime-local"
            value={form.validFrom}
            onChange={handleChange("validFrom")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 종료일</label>
          <input
            type="datetime-local"
            value={form.validUntil}
            onChange={handleChange("validUntil")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              프로그램 생성 중...
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
