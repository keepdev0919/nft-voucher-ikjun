import React from "react";
import { Voucher, STATUS_LABEL, CATEGORY_ICON } from "../../types/voucher";

interface Props {
  voucher: Voucher;
  onClick?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-v-successLight text-v-success",
  pending: "bg-v-warningLight text-v-warning",
  used: "bg-v-surface2 text-v-textMuted",
  expired: "bg-v-errorLight text-v-error",
};

export default function VoucherListItem({ voucher, onClick }: Props) {
  const icon = CATEGORY_ICON[voucher.category];
  const amount = voucher.remainingAmount.toLocaleString("ko-KR") + "원";
  const isUsed = voucher.status === "used" || voucher.status === "expired";

  return (
    <button
      className="w-full flex items-center justify-between py-3.5 border-b border-v-border last:border-b-0 text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-v-md bg-v-accentLight flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-v-text">{voucher.name}</p>
          <p className="text-xs text-v-textMuted mt-0.5">
            {isUsed ? "사용 완료" : `${voucher.expiresAt} 만료`}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-sm font-semibold ${isUsed ? "text-v-textMuted" : "text-v-accent"}`}
        >
          {amount}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLE[voucher.status]}`}
        >
          {STATUS_LABEL[voucher.status]}
        </span>
      </div>
    </button>
  );
}
