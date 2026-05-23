import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { approveMerchantOnChain, MemberResponse } from "../../services/voucherApi";
import Toast from "../../components/Toast";

interface ApprovedEntry {
  walletAddress: string;
  nickname: string;
  approved: boolean;
  at: number;
}

export default function AdminMerchantApprove() {
  const navigate = useNavigate();

  const [walletInput, setWalletInput] = useState("");
  const [approved, setApproved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ApprovedEntry[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const isValidWallet = (addr: string) =>
    /^0x[0-9a-fA-F]{40}$/.test(addr.trim());

  const handleSubmit = async () => {
    const target = walletInput.trim();
    if (!isValidWallet(target)) {
      showToast("유효한 지갑 주소를 입력해주세요. (0x + 40자)");
      return;
    }

    setLoading(true);
    try {
      const member: MemberResponse = await approveMerchantOnChain(target, approved);

      setHistory((prev) => [
        {
          walletAddress: member.walletAddress,
          nickname: member.nickname,
          approved,
          at: Date.now(),
        },
        ...prev,
      ]);

      showToast(
        approved
          ? `${member.nickname}(${member.walletAddress.slice(0, 6)}...) 승인 완료`
          : `${member.nickname}(${member.walletAddress.slice(0, 6)}...) 승인 취소 완료`,
        "success"
      );
      setWalletInput("");
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      showToast(backendMsg ?? err?.message ?? "온체인 승인 요청에 실패했습니다.");
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
        <h1 className="text-base font-semibold text-v-text">가맹점 승인</h1>
      </div>

      {/* 폼 */}
      <div className="px-6 mt-5 space-y-4 pb-6">
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">가맹점 지갑 주소</label>
          <input
            type="text"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors font-mono"
          />
          <p className="text-[11px] text-v-textMuted mt-1">0x로 시작하는 42자 이더리움 주소</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">동작</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setApproved(true)}
              className={`py-3 rounded-v-md text-sm font-semibold border transition-colors ${
                approved
                  ? "bg-v-accent text-white border-v-accent"
                  : "bg-v-surface text-v-text border-v-border"
              }`}
            >
              승인
            </button>
            <button
              type="button"
              onClick={() => setApproved(false)}
              className={`py-3 rounded-v-md text-sm font-semibold border transition-colors ${
                !approved
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-v-surface text-v-text border-v-border"
              }`}
            >
              취소
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              온체인 처리 중...
            </>
          ) : "온체인 승인"}
        </button>

        {/* 세션 내 처리 이력 */}
        {history.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-v-text mb-2">이번 세션에서 승인한 주소들</h2>
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={`${entry.walletAddress}-${entry.at}`}
                  className="bg-v-surface rounded-v-md px-4 py-3 border border-v-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-v-text truncate">{entry.nickname}</p>
                      <p className="text-[11px] font-mono text-v-textMuted truncate">
                        {entry.walletAddress}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        entry.approved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {entry.approved ? "승인됨" : "취소됨"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
