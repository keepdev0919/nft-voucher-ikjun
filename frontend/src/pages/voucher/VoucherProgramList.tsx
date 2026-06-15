import React, { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import {
  getActivePrograms,
  applyVoucher,
  VoucherProgramResponse,
} from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import {
  getCategoryIcon,
  expiryBadge,
  EXPIRY_TONE_STYLE,
} from "../../types/voucher";

type ToastState = { message: string; type: "success" | "error" | "info" } | null;

/** "YYYY.MM.DD" 포맷 */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 자격 요건 한 줄 표시용 */
function buildEligibility(program: VoucherProgramResponse): {
  ageLabel: string | null;
  regionLabel: string | null;
  isOpen: boolean;
} {
  const { minAge, maxAge, allowedRegions } = program;

  let ageLabel: string | null = null;
  if (minAge != null && maxAge != null) {
    ageLabel = `만 ${minAge}~${maxAge}세`;
  } else if (minAge != null) {
    ageLabel = `만 ${minAge}세 이상`;
  } else if (maxAge != null) {
    ageLabel = `만 ${maxAge}세 이하`;
  }

  const trimmedRegions = allowedRegions?.trim();
  const regionLabel = trimmedRegions
    ? `지역: ${trimmedRegions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .join(", ")}`
    : null;

  return {
    ageLabel,
    regionLabel,
    isOpen: !ageLabel && !regionLabel,
  };
}

export default function VoucherProgramList() {
  const { walletAddress } = useWallet();

  const [programs, setPrograms] = useState<VoucherProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await getActivePrograms();
        if (!cancelled) setPrograms(list);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ??
              "바우처 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApply = async (program: VoucherProgramResponse) => {
    if (applied.has(program.id)) return;
    if (applyingId != null) return;
    if (!walletAddress) {
      setToast({ message: "지갑 연결이 필요해요.", type: "error" });
      return;
    }

    setApplyingId(program.id);
    try {
      await applyVoucher({
        voucherProgramId: program.id,
        walletAddress,
      });
      setApplied((prev) => {
        const next = new Set(prev);
        next.add(program.id);
        return next;
      });
      setToast({
        message: "신청 완료! 내 바우처에서 확인하세요.",
        type: "success",
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        "신청에 실패했어요. 잠시 후 다시 시도해주세요.";
      setToast({ message: msg, type: "error" });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6">
        <h1 className="text-[20px] font-bold text-v-text">바우처 둘러보기</h1>
        <p className="text-xs text-v-textMuted mt-0.5">
          {loading
            ? "불러오는 중…"
            : `신청 가능한 바우처 ${programs.length}개`}
        </p>
      </div>

      {/* 본문 */}
      <div className="px-6 mt-4">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-v-surface2 border-t-v-accent animate-spin" />
          </div>
        )}

        {!loading && loadError && (
          <div className="bg-v-surface rounded-v-lg px-4 py-6 text-center text-sm text-v-error">
            {loadError}
          </div>
        )}

        {!loading && !loadError && programs.length === 0 && (
          <div className="bg-v-surface rounded-v-lg px-4 py-10 text-center text-sm text-v-textMuted">
            현재 신청 가능한 바우처가 없습니다.
          </div>
        )}

        {!loading && !loadError && programs.length > 0 && (
          <div className="space-y-3">
            {programs.map((program) => {
              const isApplied = applied.has(program.id);
              const isApplying = applyingId === program.id;
              const badge = expiryBadge(program.validUntil);
              const { ageLabel, regionLabel, isOpen } = buildEligibility(program);

              return (
                <div
                  key={program.id}
                  className="bg-v-surface rounded-v-lg px-4 py-4 shadow-v-sm"
                >
                  {/* 상단: 카테고리 + 만료 뱃지 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
                      {getCategoryIcon(program.category)} {program.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${EXPIRY_TONE_STYLE[badge.tone]}`}
                    >
                      {badge.tone === "ok" && badge.days == null
                        ? "기한 없음"
                        : badge.label}
                    </span>
                  </div>

                  {/* 프로그램 이름 */}
                  <p className="text-base font-bold text-v-text">
                    {program.name}
                  </p>

                  {/* 설명 */}
                  {program.description && (
                    <p className="text-xs text-v-textMuted mt-1 leading-relaxed">
                      {program.description}
                    </p>
                  )}

                  {/* 금액 */}
                  <p className="text-[22px] font-bold text-v-accent mt-2">
                    {program.maxValue.toLocaleString("ko-KR")}원
                  </p>

                  {/* 유효기간 */}
                  <p className="text-xs text-v-textMuted mt-1">
                    {formatDate(program.validUntil)}까지
                  </p>

                  {/* 자격 요건 */}
                  <div className="mt-3 space-y-1">
                    {isOpen ? (
                      <p className="text-[11px] text-v-textMuted">
                        누구나 신청 가능
                      </p>
                    ) : (
                      <>
                        {ageLabel && (
                          <p className="text-[11px] text-v-textMuted">
                            대상 연령: {ageLabel}
                          </p>
                        )}
                        {regionLabel && (
                          <p className="text-[11px] text-v-textMuted">
                            {regionLabel}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 신청 버튼 */}
                  <button
                    onClick={() => handleApply(program)}
                    disabled={isApplied || isApplying}
                    className={`w-full mt-3 py-3 rounded-v-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isApplied
                        ? "bg-v-surface2 text-v-textMuted cursor-default"
                        : isApplying
                        ? "bg-v-accent/70 text-white cursor-wait"
                        : "bg-v-accent text-white active:bg-v-accentHover"
                    }`}
                  >
                    {isApplying && (
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    )}
                    {isApplied
                      ? "신청 완료"
                      : isApplying
                      ? "신청 중…"
                      : "신청하기"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
