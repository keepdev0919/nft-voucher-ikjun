import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherContract } from "../../services/web3/useVoucherContract";
import { getProgramList } from "../../services/voucherApi";
import Toast from "../../components/Toast";

interface Program {
  programId: number;
  name: string;
  amount: number;
}

export default function AdminIssue() {
  const navigate = useNavigate();
  const { mintVoucher } = useVoucherContract();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  useEffect(() => {
    setLoadingPrograms(true);
    getProgramList()
      .then((res) => {
        const data = (res.data?.body ?? []).map((item: any) => ({
          programId: Number(item.programId ?? item.id ?? 0),
          name: item.name ?? "프로그램",
          amount: Number(item.amount ?? 0),
        }));
        setPrograms(data);
        if (data.length > 0) setSelectedProgram(String(data[0].programId));
      })
      .catch(() => {
        showToast("프로그램 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoadingPrograms(false));
  }, []);

  const handleIssue = async () => {
    if (!selectedProgram) {
      showToast("프로그램을 선택해주세요.");
      return;
    }
    if (!recipientAddress.trim() || !recipientAddress.startsWith("0x")) {
      showToast("유효한 지갑 주소를 입력해주세요. (0x로 시작)");
      return;
    }

    setLoading(true);
    setMintedTokenId(null);

    try {
      const tokenId = await mintVoucher(Number(selectedProgram), recipientAddress.trim());
      setMintedTokenId(tokenId);
      showToast(`바우처 발급 완료! Token ID: ${tokenId}`, "success");
      setRecipientAddress("");
    } catch (err: any) {
      showToast(err?.message ?? "바우처 발급에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProg = programs.find((p) => String(p.programId) === selectedProgram);

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
        <h1 className="text-base font-semibold text-v-text">바우처 발급</h1>
      </div>

      <div className="px-6 mt-5 space-y-4 pb-6">
        {/* 프로그램 선택 */}
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">프로그램 선택</label>
          {loadingPrograms ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-v-md border border-v-border bg-v-surface">
              <span className="w-4 h-4 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
              <span className="text-v-textMuted text-sm">불러오는 중...</span>
            </div>
          ) : programs.length === 0 ? (
            <div className="px-4 py-3 rounded-v-md border border-v-border bg-v-surface">
              <p className="text-v-textMuted text-sm">프로그램이 없습니다. 먼저 생성해주세요.</p>
            </div>
          ) : (
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
            >
              {programs.map((prog) => (
                <option key={prog.programId} value={String(prog.programId)}>
                  #{prog.programId} {prog.name} ({prog.amount.toLocaleString("ko-KR")}원)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 선택된 프로그램 요약 */}
        {selectedProg && (
          <div className="bg-v-surface rounded-v-md px-4 py-3 border border-v-border">
            <p className="text-xs text-v-textMuted">선택된 프로그램</p>
            <p className="text-sm font-semibold text-v-text mt-0.5">{selectedProg.name}</p>
            <p className="text-sm font-bold text-v-accent">{selectedProg.amount.toLocaleString("ko-KR")}원</p>
          </div>
        )}

        {/* 수령자 지갑 주소 */}
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">수령자 지갑 주소</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors font-mono"
          />
        </div>

        {/* 발급 버튼 */}
        <button
          onClick={handleIssue}
          disabled={loading || programs.length === 0}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              발급 중...
            </>
          ) : "바우처 발급"}
        </button>

        {/* 발급 결과 */}
        {mintedTokenId !== null && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-v-md px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <p className="text-sm font-semibold text-emerald-700">발급 완료</p>
            </div>
            <p className="text-xs text-emerald-600 mt-1">Token ID: <span className="font-mono font-bold">{mintedTokenId}</span></p>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
