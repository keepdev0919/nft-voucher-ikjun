import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import VoucherListItem from "../../components/voucher/VoucherListItem";

export default function VoucherBox() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const { vouchers, loading, error, fetchVouchers } = useVoucherList();

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  const usedVouchers = vouchers.filter((v) => v.status === "used");
  const expiredVouchers = vouchers.filter((v) => v.status === "expired");
  const totalCount = usedVouchers.length + expiredVouchers.length;

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-v-text">보관함</h1>
        {!loading && totalCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
            {totalCount}개
          </span>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="px-6 mt-3">
          <div className="bg-red-50 border border-red-200 rounded-v-md px-4 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-20">
          <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 px-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor" className="w-16 h-16 text-v-border mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <p className="text-v-textMuted text-sm">보관된 바우처가 없습니다</p>
        </div>
      ) : (
        <>
          {usedVouchers.length > 0 && (
            <div className="px-6 mt-5">
              <h2 className="text-sm font-semibold text-v-textMuted mb-2">사용 완료</h2>
              <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
                {usedVouchers.map((v) => (
                  <VoucherListItem
                    key={v.tokenId}
                    voucher={v}
                    onClick={() => navigate(`/voucher/list/${v.tokenId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {expiredVouchers.length > 0 && (
            <div className="px-6 mt-4">
              <h2 className="text-sm font-semibold text-v-textMuted mb-2">만료됨</h2>
              <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
                {expiredVouchers.map((v) => (
                  <VoucherListItem
                    key={v.tokenId}
                    voucher={v}
                    onClick={() => navigate(`/voucher/list/${v.tokenId}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
