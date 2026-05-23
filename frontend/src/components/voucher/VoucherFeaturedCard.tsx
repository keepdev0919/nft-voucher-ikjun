import React from "react";
import { VoucherResponse, VoucherStatus } from "../../services/voucherApi";
import { getCategoryIcon, expiryBadge } from "../../types/voucher";

interface Props {
  voucher: VoucherResponse;
  onClick?: () => void;
}

const STATUS_LABEL: Record<VoucherStatus, string> = {
  PENDING: "발급 중",
  ACTIVE: "사용 가능",
  USED_UP: "사용 완료",
  BURNED: "소각됨",
};

export default function VoucherFeaturedCard({ voucher, onClick }: Props) {
  const wallet = voucher.ownerWallet ?? "";
  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : voucher.onChainTokenId != null
      ? `Token #${voucher.onChainTokenId}`
      : "";
  const formattedAmount = voucher.currentValue.toLocaleString("ko-KR") + "원";
  const isActive = voucher.status === "ACTIVE";
  const icon = getCategoryIcon(voucher.programCategory);
  const expiry = expiryBadge(voucher.programValidUntil);
  // Featured 카드는 어두운 배경이라 별도 tone 클래스 대신 직접 색을 지정.
  const expiryColorClass =
    expiry.tone === "expired"
      ? "bg-red-500/30 text-red-100"
      : expiry.tone === "warn"
        ? "bg-amber-400/30 text-amber-50"
        : "bg-white/20 text-white";

  return (
    <div
      className="relative overflow-hidden rounded-v-lg p-6 cursor-pointer select-none"
      style={{
        background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      }}
      onClick={onClick}
    >
      {/* 배경 원형 장식 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 160,
          height: 160,
          top: -40,
          right: -40,
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 200,
          bottom: -60,
          left: 20,
          background: "rgba(255,255,255,0.05)",
        }}
      />

      {/* 카드 내용 */}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none" aria-hidden>
          {icon}
        </span>
        <p className="text-xs font-medium text-white/75 tracking-wide truncate">
          {voucher.programName}
        </p>
      </div>
      <p className="mt-3 text-3xl font-bold text-white tracking-tight">
        {formattedAmount}
      </p>

      {/* 상태 + 만료 뱃지 */}
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5 bg-white/20 text-white">
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          )}
          {STATUS_LABEL[voucher.status]}
        </span>
        {expiry.days !== null && (
          <span
            className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 ${expiryColorClass}`}
          >
            {expiry.label}
          </span>
        )}
      </div>

      {/* 하단 메타 */}
      <div className="mt-7 flex items-end justify-between">
        <span className="font-mono text-[11px] text-white/65">{shortAddress}</span>
        {voucher.onChainTokenId != null && (
          <span className="text-xs text-white/80">
            Token #{voucher.onChainTokenId}
          </span>
        )}
      </div>
    </div>
  );
}
