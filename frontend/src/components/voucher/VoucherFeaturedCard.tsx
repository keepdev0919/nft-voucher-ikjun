import React from "react";
import { Voucher, STATUS_LABEL } from "../../types/voucher";

interface Props {
  voucher: Voucher;
  onClick?: () => void;
}

export default function VoucherFeaturedCard({ voucher, onClick }: Props) {
  const shortAddress = `${voucher.tokenAddress.slice(0, 6)}...${voucher.tokenAddress.slice(-4)}`;
  const formattedAmount = voucher.remainingAmount.toLocaleString("ko-KR") + "원";

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
      <p className="text-xs font-medium text-white/75 tracking-wide">
        {voucher.name}
      </p>
      <p className="mt-3 text-3xl font-bold text-white tracking-tight">
        {formattedAmount}
      </p>

      {/* 상태 뱃지 */}
      <div className="mt-1 flex items-center gap-2">
        {voucher.status === "active" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5 bg-white/20 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {STATUS_LABEL[voucher.status]}
          </span>
        )}
        {voucher.status !== "active" && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 bg-white/20 text-white">
            {STATUS_LABEL[voucher.status]}
          </span>
        )}
      </div>

      {/* 하단 메타 */}
      <div className="mt-7 flex items-end justify-between">
        <span className="font-mono text-[11px] text-white/65">{shortAddress}</span>
        <span className="text-xs text-white/80">~{voucher.expiresAt}</span>
      </div>
    </div>
  );
}
