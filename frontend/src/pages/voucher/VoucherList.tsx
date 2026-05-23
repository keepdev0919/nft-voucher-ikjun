import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useWallet } from "../../context/WalletContext";
import VoucherFeaturedCard from "../../components/voucher/VoucherFeaturedCard";
import VoucherListItem from "../../components/voucher/VoucherListItem";

export default function VoucherList() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const { vouchers, loading, error, fetchVouchers } = useVoucherList();

  useEffect(() => {
    if (walletAddress) fetchVouchers(walletAddress);
  }, [walletAddress, fetchVouchers]);

  const featured = vouchers.find((v) => v.status === "ACTIVE");
  const activeList = vouchers.filter((v) => v.status === "ACTIVE");
  const doneList = vouchers.filter(
    (v) => v.status === "USED_UP" || v.status === "BURNED"
  );

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-v-text">내 바우처</h1>
        {!loading && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-v-accentLight text-v-accent">
            {activeList.length}개 보유
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
      ) : (
        <>
          {/* Featured Card */}
          {featured && (
            <div className="px-6 mt-4">
              <VoucherFeaturedCard
                voucher={featured}
                onClick={() => navigate(`/voucher/list/${featured.id}`)}
              />
            </div>
          )}

          {/* 보유 중 */}
          {activeList.length > 0 && (
            <div className="px-6 mt-5">
              <h2 className="text-sm font-semibold text-v-text mb-2">보유 중인 바우처</h2>
              <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
                {activeList.map((v) => (
                  <VoucherListItem
                    key={v.id}
                    voucher={v}
                    onClick={() => navigate(`/voucher/list/${v.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 사용/만료 */}
          {doneList.length > 0 && (
            <div className="px-6 mt-4">
              <h2 className="text-sm font-semibold text-v-textMuted mb-2">사용 완료</h2>
              <div className="bg-v-surface rounded-v-lg px-4 shadow-v-sm">
                {doneList.map((v) => (
                  <VoucherListItem
                    key={v.id}
                    voucher={v}
                    onClick={() => navigate(`/voucher/list/${v.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {vouchers.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center mt-24 px-6 text-center">
              <p className="text-v-textMuted text-sm">
                보유한 바우처가 없습니다. 기관에서 발급을 기다려주세요.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
