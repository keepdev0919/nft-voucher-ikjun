import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActivePrograms, VoucherProgramResponse } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

function formatDate(val: string | null | undefined): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { nickname } = useWallet();
  const [programs, setPrograms] = useState<VoucherProgramResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getActivePrograms()
      .then((data) => setPrograms(data ?? []))
      .catch((err) => {
        setToast(err?.response?.data?.message ?? "프로그램 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6">
        <p className="text-[13px] text-v-textMuted">기관 대시보드</p>
        <h1 className="text-[22px] font-bold text-v-text mt-0.5">{nickname ?? "기관"}님</h1>
      </div>

      {/* 요약 카드 */}
      <div className="px-6 mt-4">
        <div
          className="rounded-v-lg p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
        >
          <div className="absolute rounded-full pointer-events-none" style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }} />
          <p className="text-xs text-white/70 font-medium">운영 중인 프로그램</p>
          <p className="text-[32px] font-bold text-white mt-1 tracking-tight">{programs.length}개</p>
        </div>
      </div>

      {/* 빠른 액세스 */}
      <div className="px-6 mt-3">
        <button
          onClick={() => navigate("/admin/create")}
          className="w-full py-3.5 rounded-v-md bg-v-accentLight text-v-accent text-[13px] font-semibold active:bg-v-accent/20 transition-colors"
        >
          + 새 프로그램 생성
        </button>
      </div>

      {/* 프로그램 목록 */}
      <div className="px-6 mt-5">
        <h2 className="text-sm font-semibold text-v-text mb-2">바우처 프로그램 목록</h2>

        {loading ? (
          <div className="flex justify-center mt-8">
            <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-v-surface rounded-v-lg p-6 text-center shadow-v-sm">
            <p className="text-v-textMuted text-sm">생성된 프로그램이 없습니다</p>
            <button
              onClick={() => navigate("/admin/create")}
              className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium"
            >
              첫 프로그램 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {programs.map((prog) => (
              <div key={prog.id} className="bg-v-surface rounded-v-lg px-4 py-3.5 shadow-v-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-v-text">{prog.name}</p>
                    <p className="text-xs text-v-textMuted mt-0.5">{prog.category} · {prog.totalSupply}개 발행</p>
                    <p className="text-xs text-v-textMuted mt-0.5">유효기간: {formatDate(prog.validUntil)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-v-accent">{Number(prog.maxValue).toLocaleString("ko-KR")}원</p>
                    <p className="text-[10px] text-v-textMuted mt-0.5">#{prog.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast} type="error" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
