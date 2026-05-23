import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  getVoucher,
  getVoucherQrData,
  VoucherResponse,
  VoucherQrResponse,
  VoucherStatus,
} from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import { getCategoryIcon, expiryBadge } from "../../types/voucher";

const STATUS_LABEL: Record<VoucherStatus, string> = {
  PENDING: "발급 중",
  ACTIVE: "사용 가능",
  USED_UP: "사용 완료",
  BURNED: "소각됨",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function maskWallet(addr: string | null | undefined): string {
  if (!addr) return "-";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function VoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [voucher, setVoucher] = useState<VoucherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrData, setQrData] = useState<VoucherQrResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const voucherId = Number(id);

  const loadVoucher = React.useCallback(async () => {
    if (!walletAddress || !voucherId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVoucher(voucherId, walletAddress);
      setVoucher(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        setError("이 바우처에 접근할 권한이 없습니다. 본인 지갑으로 로그인했는지 확인해주세요.");
      } else if (status === 404) {
        setError("바우처를 찾을 수 없습니다.");
      } else {
        setError(e?.response?.data?.message ?? "바우처 정보를 불러오지 못했습니다.");
      }
      setVoucher(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, voucherId]);

  useEffect(() => {
    void loadVoucher();
  }, [loadVoucher]);

  const openQR = async () => {
    setShowQR(true);
    if (qrData || qrLoading) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const data = await getVoucherQrData(voucherId);
      setQrData(data);
    } catch (e: any) {
      setQrError(e?.response?.data?.message ?? "QR 정보를 불러오지 못했습니다.");
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-v-textMuted text-sm">{error}</p>
        <button
          onClick={() => loadVoucher()}
          className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium"
        >
          다시 시도
        </button>
        <button
          onClick={() => navigate("/voucher/list")}
          className="mt-2 px-4 py-2 text-xs text-v-textMuted underline"
        >
          목록으로
        </button>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-v-textMuted">바우처를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isActive = voucher.status === "ACTIVE";
  const formattedCurrent = voucher.currentValue.toLocaleString("ko-KR") + "원";
  const formattedInitial = voucher.initialValue.toLocaleString("ko-KR") + "원";
  const shortOwner = maskWallet(voucher.ownerWallet);
  const shortIssuer = maskWallet(voucher.issuedBy);
  const tokenLabel =
    voucher.onChainTokenId != null ? `Token #${voucher.onChainTokenId}` : "발급 처리 중";
  const categoryIcon = getCategoryIcon(voucher.programCategory);
  const expiry = expiryBadge(voucher.programValidUntil);
  const expiryDateLabel = formatDate(voucher.programValidUntil);
  // 소유자 표시: "닉네임 (0x...단축주소)" 또는 닉네임이 비었으면 주소만.
  const ownerDisplay = voucher.ownerNickname
    ? `${voucher.ownerNickname} (${shortOwner})`
    : shortOwner;
  const expiryLine =
    expiry.days === null
      ? "기한 없음"
      : expiry.tone === "expired"
        ? `${expiryDateLabel}까지 (만료됨)`
        : `${expiryDateLabel}까지 (${expiry.label})`;

  // TODO: 결제 흐름이 가맹점 QR → 사용자 스캔으로 변경됨. 이 QR은 임시.
  const qrPayload = qrData ? JSON.stringify(qrData) : "";

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/voucher/list")}
          className="text-v-text p-0.5 -ml-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">바우처 상세</h1>
      </div>

      {/* 카드 */}
      <div
        className="mx-6 mt-4 rounded-v-lg p-6 relative overflow-hidden"
        style={{
          background: isActive
            ? "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)"
            : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }}
        />
        {/* 카테고리 아이콘 (큰 사이즈) */}
        <div
          className="absolute text-[64px] leading-none pointer-events-none select-none opacity-30"
          style={{ top: 12, right: 16 }}
          aria-hidden
        >
          {categoryIcon}
        </div>
        <div className="flex items-center gap-2 relative">
          <span className="text-base leading-none" aria-hidden>{categoryIcon}</span>
          <p className="text-xs text-white/75 font-medium truncate">{voucher.programName}</p>
        </div>
        <p className="text-[30px] font-bold text-white mt-2 tracking-tight relative">{formattedCurrent}</p>
        <p className="text-[11px] text-white/60 mt-1 relative">원래 {formattedInitial}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap relative">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
            {STATUS_LABEL[voucher.status]}
          </span>
          {expiry.days !== null && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                expiry.tone === "expired"
                  ? "bg-red-500/30 text-red-100"
                  : expiry.tone === "warn"
                    ? "bg-amber-400/30 text-amber-50"
                    : "bg-white/15 text-white/90"
              }`}
            >
              {expiry.label}
            </span>
          )}
        </div>
        <div className="mt-6 flex items-end justify-between relative">
          <span className="font-mono text-[11px] text-white/60">{tokenLabel}</span>
          <span className="text-xs text-white/75">{formatDate(voucher.mintedAt)}</span>
        </div>
      </div>

      {/* 바우처 정보 */}
      <div className="px-6 mt-5 space-y-2">
        {([
          ["프로그램", voucher.programName],
          ["카테고리", `${categoryIcon} ${voucher.programCategory || "기타"}`],
          ["유효기간", expiryLine, expiry.tone !== "ok" ? expiry.tone : undefined],
          ["소유자", ownerDisplay],
          ["발행 기관", shortIssuer],
          ["토큰 ID", tokenLabel],
          ["상태", STATUS_LABEL[voucher.status]],
          ["원래 금액", formattedInitial],
          ["발급일", formatDate(voucher.mintedAt)],
        ] as Array<[string, string, ("warn" | "expired" | undefined)?]>).map(
          ([label, value, tone]) => (
            <div
              key={label}
              className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm gap-3"
            >
              <span className="text-sm text-v-textMuted flex-shrink-0">{label}</span>
              <span
                className={`text-sm font-medium text-right truncate ${
                  tone === "expired"
                    ? "text-v-error"
                    : tone === "warn"
                      ? "text-amber-700"
                      : "text-v-text"
                }`}
              >
                {value}
              </span>
            </div>
          ),
        )}
      </div>

      {/* 사용하기 버튼 */}
      {isActive && (
        <div className="px-6 mt-5 pb-8">
          <button
            onClick={openQR}
            className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors"
          >
            사용하기
          </button>
        </div>
      )}

      {/* QR 전체화면 오버레이 */}
      {/* TODO: 결제 흐름이 가맹점 QR → 사용자 스캔으로 변경됨. 이 QR은 임시. */}
      {showQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-8">
          <p className="text-white/60 text-sm mb-2">{voucher.programName}</p>
          <p className="text-white text-[28px] font-bold mb-6">{formattedCurrent}</p>

          <div className="bg-white p-5 rounded-2xl shadow-2xl min-w-[260px] min-h-[260px] flex items-center justify-center">
            {qrLoading ? (
              <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
            ) : qrError ? (
              <p className="text-red-600 text-xs text-center px-4">{qrError}</p>
            ) : qrPayload ? (
              <QRCode value={qrPayload} size={220} />
            ) : null}
          </div>

          <p className="text-white/40 text-xs mt-5 font-mono">{tokenLabel}</p>
          <p className="text-white/50 text-sm mt-3 text-center">
            가맹점에 이 QR 코드를 보여주세요
          </p>

          <button
            onClick={() => setShowQR(false)}
            className="mt-10 px-8 py-3 rounded-full bg-white/15 text-white text-sm font-medium"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
