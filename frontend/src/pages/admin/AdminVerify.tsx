import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyToken, VerificationResponse } from "../../services/voucherApi";
import Toast from "../../components/Toast";

// 지갑 주소 단축 표기: 0x1234...abcd
function shortenAddress(addr: string | null): string {
  if (!addr) return "-";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// 해시(0x...64자) 단축 표기: 첫 6 + 마지막 4
function shortenHash(hash: string | null | undefined): string {
  if (!hash) return "-";
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// 검증 시각을 한국식으로 표시
function formatCheckedAt(val: string | null | undefined): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 상태별 배지 스타일
function statusBadgeClasses(status: VerificationResponse["status"]): string {
  switch (status) {
    case "VERIFIED":
      return "bg-green-500/20 text-green-700 border-green-500";
    case "MISMATCH":
      return "bg-red-500/20 text-red-700 border-red-500";
    case "MISSING_DB":
    case "MISSING_ONCHAIN":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500";
    default:
      return "bg-v-accentLight text-v-accent border-v-accent";
  }
}

// 상태별 한글 라벨
function statusLabel(status: VerificationResponse["status"]): string {
  switch (status) {
    case "VERIFIED":
      return "검증 완료";
    case "MISMATCH":
      return "불일치 감지";
    case "MISSING_DB":
      return "DB 누락";
    case "MISSING_ONCHAIN":
      return "온체인 누락";
    default:
      return status;
  }
}

// 일치 여부 아이콘 (✓ / ✗) — 비교 셀이 양쪽 다 존재할 때만 의미가 있음
function MatchIcon({ match, available }: { match: boolean; available: boolean }) {
  if (!available) {
    return <span className="text-v-textMuted text-base">-</span>;
  }
  return match ? (
    <span className="text-green-600 font-bold text-base">✓</span>
  ) : (
    <span className="text-red-600 font-bold text-base">✗</span>
  );
}

export default function AdminVerify() {
  const navigate = useNavigate();
  const [tokenIdInput, setTokenIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(
    null
  );

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleVerify = async () => {
    const trimmed = tokenIdInput.trim();
    if (!trimmed) {
      showToast("토큰 ID를 입력해주세요.");
      return;
    }
    const tokenId = Number(trimmed);
    if (!Number.isInteger(tokenId) || tokenId < 0) {
      showToast("유효한 토큰 ID(0 이상의 정수)를 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await verifyToken(tokenId);
      setResult(res);
      if (res.status === "VERIFIED") {
        showToast("무결성 검증을 통과했습니다.", "success");
      } else if (res.status === "MISMATCH") {
        showToast("DB와 온체인 데이터가 일치하지 않습니다.", "error");
      } else {
        showToast(res.message || "한쪽 데이터가 누락되었습니다.", "info");
      }
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      showToast(backendMsg ?? err?.message ?? "검증 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleVerify();
    }
  };

  // 비교 표에서 사용할 셀 데이터
  const dbHash = result?.dbHashes && result.dbHashes.length > 0 ? result.dbHashes[0] : null;
  const onChainHash =
    result?.onChainHashes && result.onChainHashes.length > 0 ? result.onChainHashes[0] : null;

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/home")}
          className="text-v-text p-0.5 -ml-0.5"
          aria-label="뒤로 가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">토큰 무결성 검증</h1>
      </div>

      {/* 안내문 */}
      <div className="px-6 mt-4">
        <p className="text-xs text-v-textMuted leading-relaxed">
          입력한 토큰 ID의 데이터를 <span className="font-semibold text-v-text">DB</span>와{" "}
          <span className="font-semibold text-v-text">온체인</span>에서 동시에 조회해
          잔액·해시·nonce 일치 여부를 비교합니다.
        </p>
      </div>

      {/* 입력 영역 */}
      <div className="px-6 mt-5 space-y-3">
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">토큰 ID</label>
          <input
            type="number"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="토큰 ID를 입력하세요"
            min={0}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              검증 중...
            </>
          ) : (
            "검증하기"
          )}
        </button>
      </div>

      {/* 검증 결과 카드 */}
      {result && (
        <div className="px-6 mt-6 pb-8 space-y-4">
          {/* 상태 배지 */}
          <div
            className={`rounded-v-lg border-2 px-5 py-4 flex items-center justify-between ${statusBadgeClasses(
              result.status
            )}`}
          >
            <div>
              <p className="text-[11px] font-medium opacity-80">검증 상태</p>
              <p className="text-lg font-bold mt-0.5">{statusLabel(result.status)}</p>
            </div>
            <p className="text-xs font-mono opacity-80">#{result.tokenId}</p>
          </div>

          {/* 메타 카드 */}
          <div className="bg-v-surface rounded-v-lg shadow-v-sm border border-v-border p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-v-textMuted">소유자 지갑</span>
              <span className="text-xs font-mono text-v-text">
                {shortenAddress(result.ownerWallet)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-v-textMuted">프로그램</span>
              <span className="text-xs font-semibold text-v-text truncate max-w-[60%] text-right">
                {result.programName ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-v-textMuted">검증 시각</span>
              <span className="text-xs text-v-text">{formatCheckedAt(result.checkedAt)}</span>
            </div>
          </div>

          {/* 비교 표 */}
          <div className="bg-v-surface rounded-v-lg shadow-v-sm border border-v-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-v-bg">
                <tr className="text-v-textMuted">
                  <th className="px-3 py-2.5 text-left font-semibold">항목</th>
                  <th className="px-3 py-2.5 text-left font-semibold">DB</th>
                  <th className="px-3 py-2.5 text-left font-semibold">온체인</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-12">일치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-border">
                <tr>
                  <td className="px-3 py-3 font-semibold text-v-text">잔액</td>
                  <td className="px-3 py-3 text-v-text">
                    {result.dbValue !== null
                      ? `${Number(result.dbValue).toLocaleString("ko-KR")}원`
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-v-text">
                    {result.onChainValue !== null
                      ? `${Number(result.onChainValue).toLocaleString("ko-KR")}원`
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <MatchIcon
                      match={result.valueMatch}
                      available={result.dbValue !== null && result.onChainValue !== null}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-v-text">Hash</td>
                  <td className="px-3 py-3 font-mono text-v-text">{shortenHash(dbHash)}</td>
                  <td className="px-3 py-3 font-mono text-v-text">{shortenHash(onChainHash)}</td>
                  <td className="px-3 py-3 text-center">
                    <MatchIcon
                      match={result.hashMatch}
                      available={!!dbHash && !!onChainHash}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-v-text">Nonce</td>
                  <td className="px-3 py-3 text-v-text">
                    {result.dbNonce !== null ? result.dbNonce : "-"}
                  </td>
                  <td className="px-3 py-3 text-v-text">
                    {result.onChainNonce !== null ? result.onChainNonce : "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <MatchIcon
                      match={result.nonceMatch}
                      available={result.dbNonce !== null && result.onChainNonce !== null}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 메시지 */}
          {result.message && (
            <div className="bg-v-accentLight rounded-v-md px-4 py-3">
              <p className="text-xs text-v-text leading-relaxed">{result.message}</p>
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
