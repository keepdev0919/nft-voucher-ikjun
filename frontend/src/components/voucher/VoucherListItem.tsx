import React from "react";
import { VoucherResponse, VoucherStatus } from "../../services/voucherApi";
import {
  getCategoryIcon,
  expiryBadge,
  EXPIRY_TONE_STYLE,
} from "../../types/voucher";

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

const STATUS_STYLE: Record<VoucherStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-v-successLight text-v-success",
  USED_UP: "bg-v-surface2 text-v-textMuted",
  BURNED: "bg-v-errorLight text-v-error",
};

export default function VoucherListItem({ voucher, onClick }: Props) {
  const amount = voucher.currentValue.toLocaleString("ko-KR") + "원";
  const isInactive =
    voucher.status === "USED_UP" || voucher.status === "BURNED";

  const icon = getCategoryIcon(voucher.programCategory);
  const expiry = expiryBadge(voucher.programValidUntil);

  // 사용 완료/소각인 경우 상태로, 그 외에는 카테고리명을 표시.
  const subLabel = isInactive
    ? STATUS_LABEL[voucher.status]
    : voucher.programCategory || "기타";

  return (
    <button
      className="w-full flex items-center justify-between py-3.5 border-b border-v-border last:border-b-0 text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-v-md bg-v-accentLight flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-v-text truncate">{voucher.programName}</p>
          <p className="text-xs text-v-textMuted mt-0.5 truncate">{subLabel}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-sm font-semibold ${isInactive ? "text-v-textMuted" : "text-v-accent"}`}
        >
          {amount}
        </span>
        <div className="flex items-center gap-1">
          {!isInactive && expiry.days !== null && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${EXPIRY_TONE_STYLE[expiry.tone]}`}
            >
              {expiry.label}
            </span>
          )}
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLE[voucher.status]}`}
          >
            {STATUS_LABEL[voucher.status]}
          </span>
        </div>
      </div>
    </button>
  );
}
