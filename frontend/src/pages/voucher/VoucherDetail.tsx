import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import { CATEGORY_ICON, CATEGORY_LABEL, STATUS_LABEL } from "../../types/voucher";

export default function VoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const { vouchers, loading, error, fetchVouchers } = useVoucherList();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  const voucher = vouchers.find((v) => v.tokenId === Number(id));

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
          onClick={() => walletAddress && fetchVouchers(walletAddress)}
          className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium"
        >
          다시 시도
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

  const isActive = voucher.status === "active";
  const formattedAmount = voucher.remainingAmount.toLocaleString("ko-KR") + "원";
  const shortAddress = voucher.tokenAddress
    ? `${voucher.tokenAddress.slice(0, 8)}...${voucher.tokenAddress.slice(-4)}`
    : `Token #${voucher.tokenId}`;

  // 가맹점 QR 스캔에서 파싱할 데이터
  const qrValue = JSON.stringify({ tokenId: voucher.tokenId });

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
        <p className="text-xs text-white/75 font-medium">{voucher.name}</p>
        <p className="text-[30px] font-bold text-white mt-2 tracking-tight">{formattedAmount}</p>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
            {STATUS_LABEL[voucher.status]}
          </span>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <span className="font-mono text-[11px] text-white/60">{shortAddress}</span>
          <span className="text-xs text-white/75">~{voucher.expiresAt}</span>
        </div>
      </div>

      {/* 바우처 정보 */}
      <div className="px-6 mt-5 space-y-2">
        {[
          ["발급처", voucher.issuedBy || "-"],
          ["유효기간", voucher.expiresAt],
          ["카테고리", `${CATEGORY_ICON[voucher.category]} ${CATEGORY_LABEL[voucher.category]}`],
          ...(voucher.allowedCategories.length > 0
            ? [["허용 가맹점", voucher.allowedCategories.join(", ")]]
            : []),
          ["원래 금액", `${voucher.amount.toLocaleString("ko-KR")}원`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm"
          >
            <span className="text-sm text-v-textMuted">{label}</span>
            <span className="text-sm font-medium text-v-text">{value}</span>
          </div>
        ))}
      </div>

      {/* 사용하기 버튼 */}
      {isActive && (
        <div className="px-6 mt-5 pb-8">
          <button
            onClick={() => setShowQR(true)}
            className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors"
          >
            사용하기
          </button>
        </div>
      )}

      {/* QR 전체화면 오버레이 */}
      {showQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-8">
          <p className="text-white/60 text-sm mb-2">{voucher.name}</p>
          <p className="text-white text-[28px] font-bold mb-6">{formattedAmount}</p>

          <div className="bg-white p-5 rounded-2xl shadow-2xl">
            <QRCode value={qrValue} size={220} />
          </div>

          <p className="text-white/40 text-xs mt-5 font-mono">Token #{voucher.tokenId}</p>
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
