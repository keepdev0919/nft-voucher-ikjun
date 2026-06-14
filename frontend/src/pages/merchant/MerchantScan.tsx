import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "../../components/QrScanner";
import Toast from "../../components/Toast";
import { VoucherQrResponse } from "../../services/voucherApi";
import { getCategoryIcon, expiryBadge } from "../../types/voucher";

/**
 * 가맹점이 사용자의 VoucherDetail QR을 스캔하는 화면.
 *
 * QR 페이로드는 백엔드 VoucherQrResponse를 JSON.stringify한 것:
 *   {
 *     voucherId, ownerWallet, ownerNickname, onChainTokenId,
 *     currentValue, programName, category, expiryDate, isValid
 *   }
 *
 * 스캔 성공 → 정보 카드 표시 → "이 바우처로 결제" → /merchant/verify
 *
 * NOTE: 본 화면에서는 별도의 백엔드 검증 호출을 하지 않는다.
 * 실제 검증/금액 차감은 다음 단계(MerchantVerify)에서 merchantPrepareUse가 담당.
 */

function maskWallet(addr: string | null | undefined): string {
  if (!addr) return "-";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function MerchantScan() {
  const navigate = useNavigate();
  const [voucherInfo, setVoucherInfo] = useState<VoucherQrResponse | null>(null);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleScan = useCallback(
    (raw: string) => {
      if (paused) return;

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // 잠깐 일시정지했다가 자동 재개 — 사용자가 다른 QR을 가져올 시간 확보
        setPaused(true);
        showToast("유효한 바우처 QR 코드가 아닙니다.");
        setTimeout(() => setPaused(false), 1000);
        return;
      }

      if (!parsed || typeof parsed !== "object" || parsed.voucherId == null) {
        setPaused(true);
        showToast("바우처 정보를 인식할 수 없습니다.");
        setTimeout(() => setPaused(false), 1000);
        return;
      }

      // VoucherQrResponse 형태로 정규화 (필드가 모자라면 안전 기본값)
      const info: VoucherQrResponse = {
        voucherId: Number(parsed.voucherId),
        ownerWallet: String(parsed.ownerWallet ?? ""),
        ownerNickname: String(parsed.ownerNickname ?? ""),
        onChainTokenId:
          parsed.onChainTokenId == null ? null : Number(parsed.onChainTokenId),
        currentValue: Number(parsed.currentValue ?? 0),
        programName: String(parsed.programName ?? "바우처"),
        category: String(parsed.category ?? ""),
        expiryDate: parsed.expiryDate ?? null,
        isValid: Boolean(parsed.isValid ?? true),
      };

      setVoucherInfo(info);
      setPaused(true);
    },
    [paused],
  );

  const handleScanError = useCallback((err: Error) => {
    // 라이브러리에서 흔히 발생하는 디코드 실패는 무시하고, 카메라 권한 등 치명적 에러만 알림
    if (/permission|denied|NotAllowed/i.test(err.message ?? "")) {
      showToast("카메라 권한이 필요합니다.");
    }
  }, []);

  const handleRescan = () => {
    setVoucherInfo(null);
    setPaused(false);
  };

  const handleProceed = () => {
    if (!voucherInfo || !voucherInfo.isValid) return;
    navigate("/merchant/verify", { state: { voucherInfo } });
  };

  // 카드 표시용 파생값
  const expiry = voucherInfo ? expiryBadge(voucherInfo.expiryDate) : null;
  const categoryIcon = voucherInfo ? getCategoryIcon(voucherInfo.category) : "🎫";
  const expiryDateLabel = voucherInfo ? formatDate(voucherInfo.expiryDate) : "-";

  return (
    <div className="min-h-full bg-[#0D0D18] flex flex-col">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 pt-2">
        <h1 className="text-xl font-semibold text-white">가맹점</h1>
        <p className="text-[13px] text-white/45 mt-0.5">
          결제 방식을 선택하세요
        </p>
      </div>

      {/* 메인 액션: 결제 받기 (QR 생성) — 신규 흐름 */}
      <div className="px-6 mt-5">
        <button
          type="button"
          onClick={() => navigate("/merchant/payment-request")}
          className="w-full rounded-v-lg p-5 text-left relative overflow-hidden active:opacity-90 transition-opacity"
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
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
          <div className="relative flex items-start gap-3">
            <div className="w-11 h-11 rounded-v-md bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white text-base font-bold">결제 받기 (QR 생성)</p>
              <p className="text-white/75 text-xs mt-1">
                금액을 입력하면 QR이 생성됩니다. 사용자가 스캔하면 자동 결제됩니다.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 보조 액션 안내 */}
      <div className="px-6 mt-6">
        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">
          (옛) QR 스캔 결제
        </p>
        <p className="text-[11px] text-white/35 mt-1">
          시연 호환용 — 사용자의 바우처 QR을 직접 스캔하는 옛 방식입니다.
        </p>
      </div>

      {/* 스캐너 */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 mt-3">
        <div className="w-full max-w-xs">
          <QrScanner
            onScan={handleScan}
            onError={handleScanError}
            paused={paused}
            className="aspect-square"
          />
        </div>

        {!voucherInfo && (
          <p className="text-white/40 text-xs mt-5">
            QR 코드를 사각형 안에 맞춰주세요
          </p>
        )}

        {/* 바우처 정보 카드 */}
        {voucherInfo && (
          <div className="mt-5 w-full max-w-xs space-y-3">
            <div
              className="rounded-v-lg p-5 relative overflow-hidden"
              style={{
                background: voucherInfo.isValid
                  ? "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)"
                  : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              }}
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 140,
                  height: 140,
                  top: -36,
                  right: -36,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <div
                className="absolute text-[56px] leading-none pointer-events-none select-none opacity-30"
                style={{ top: 10, right: 14 }}
                aria-hidden
              >
                {categoryIcon}
              </div>

              <div className="flex items-center gap-2 relative">
                <span className="text-base leading-none" aria-hidden>
                  {categoryIcon}
                </span>
                <p className="text-xs text-white/75 font-medium truncate">
                  {voucherInfo.programName}
                </p>
              </div>

              <p className="text-[28px] font-bold text-white mt-2 tracking-tight relative">
                {voucherInfo.currentValue.toLocaleString("ko-KR")}원
              </p>

              <div className="mt-3 space-y-1 relative">
                <p className="text-xs text-white/70">
                  소유자:{" "}
                  <span className="text-white font-medium">
                    {voucherInfo.ownerNickname || "익명"}
                  </span>{" "}
                  <span className="text-white/60 font-mono">
                    ({maskWallet(voucherInfo.ownerWallet)})
                  </span>
                </p>
                <p className="text-xs text-white/70">
                  유효기간:{" "}
                  <span className="text-white font-medium">
                    {expiryDateLabel}
                    {expiry && expiry.days !== null
                      ? ` (${expiry.label})`
                      : ""}
                  </span>
                </p>
              </div>

              {!voucherInfo.isValid && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-200 inline-block" />
                  <span className="text-red-50 text-xs font-semibold">
                    결제 불가
                  </span>
                </div>
              )}
            </div>

            {voucherInfo.isValid ? (
              <button
                onClick={handleProceed}
                className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
              >
                이 바우처로 결제
              </button>
            ) : (
              <p className="text-center text-xs text-red-300">
                이 바우처는 사용할 수 없습니다 (만료, 잔액 부족 또는 비활성 상태).
              </p>
            )}

            <button
              onClick={handleRescan}
              className="w-full py-3 rounded-v-md bg-white/10 text-white/70 text-sm transition-colors"
            >
              다시 스캔
            </button>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
