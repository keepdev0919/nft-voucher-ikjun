import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { verifyVoucher } from "../../services/voucherApi";
import Toast from "../../components/Toast";

interface VerifyResult {
  tokenId: number;
  ownerName: string;
  amount: number;
  expiresAt: string;
  programName: string;
  isValid: boolean;
}

export default function MerchantScan() {
  const navigate = useNavigate();
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const [paused, setPaused] = useState(false);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleDecode = useCallback(async (raw: string) => {
    if (paused) return;
    setPaused(true);
    setScannedResult(raw);
    setVerifyResult(null);
    setLoading(true);

    try {
      // QR 데이터에서 tokenId 파싱 (JSON 또는 숫자 문자열)
      let tokenId: number;
      try {
        const parsed = JSON.parse(raw);
        tokenId = Number(parsed?.tokenId ?? parsed);
      } catch {
        tokenId = Number(raw.trim());
      }

      if (!tokenId || isNaN(tokenId)) {
        showToast("유효한 바우처 QR 코드가 아닙니다.");
        setPaused(false);
        return;
      }

      const res = await verifyVoucher(tokenId);
      const data = res.data;

      // expiryDate 타임스탬프 → 날짜 문자열
      let expiresAt = data.expiryDate ?? data.expiresAt ?? "";
      if (typeof expiresAt === "number" || /^\d{10,}/.test(String(expiresAt))) {
        const d = new Date(Number(expiresAt) * 1000);
        expiresAt = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
      }

      setVerifyResult({
        tokenId,
        ownerName: data.ownerName ?? data.nickname ?? "알 수 없음",
        amount: Number(data.amount ?? data.remainingAmount ?? 0),
        expiresAt,
        programName: data.programName ?? data.name ?? "바우처",
        isValid: data.isValid ?? data.valid ?? true,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "바우처 검증에 실패했습니다.";
      showToast(msg);
      setPaused(false);
    } finally {
      setLoading(false);
    }
  }, [paused]);

  const handleError = useCallback((err: Error) => {
    setCameraError("카메라 접근 권한이 필요합니다.");
    console.error(err);
  }, []);

  const handleReset = () => {
    setScannedResult(null);
    setVerifyResult(null);
    setPaused(false);
  };

  const handleProceed = () => {
    if (!verifyResult) return;
    navigate("/merchant/verify", { state: { voucherInfo: verifyResult } });
  };

  return (
    <div className="h-full bg-[#0D0D18] flex flex-col">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">QR 스캔</h1>
          <p className="text-[13px] text-white/45 mt-0.5">고객의 바우처 QR 코드를 스캔하세요</p>
        </div>
      </div>

      {/* 스캐너 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-4">
        <div className="relative w-64 h-64 rounded-v-md overflow-hidden">
          {!cameraError && !paused ? (
            <QrScanner
              onDecode={handleDecode}
              onError={handleError}
              containerStyle={{ width: "100%", height: "100%" }}
              videoStyle={{ objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-v-md">
              <div className="text-center px-4">
                {loading ? (
                  <span className="w-8 h-8 border-2 border-white/30 border-t-v-accent rounded-full animate-spin inline-block" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white/30 mx-auto mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    </svg>
                    <p className="text-white/50 text-xs">{cameraError ?? "처리 중..."}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 코너 브래킷 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-v-accent rounded-tl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-v-accent rounded-tr" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-v-accent rounded-bl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-v-accent rounded-br" />
          </div>
        </div>

        <p className="text-white/30 text-xs mt-5">QR 코드를 사각형 안에 맞춰주세요</p>

        {/* 검증 결과 */}
        {verifyResult && (
          <div className="mt-4 w-full max-w-xs space-y-3">
            <div
              className={`rounded-v-md p-4 border ${
                verifyResult.isValid
                  ? "bg-emerald-900/40 border-emerald-500/30"
                  : "bg-red-900/40 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full inline-block ${verifyResult.isValid ? "bg-emerald-400" : "bg-red-400"}`} />
                <p className="text-white text-sm font-medium">
                  {verifyResult.isValid ? "유효한 바우처" : "유효하지 않은 바우처"}
                </p>
              </div>
              <div className="space-y-1 text-xs text-white/60">
                <p>소유자: <span className="text-white/80">{verifyResult.ownerName}</span></p>
                <p>잔액: <span className="text-white/80 font-semibold">{verifyResult.amount.toLocaleString("ko-KR")}원</span></p>
                <p>유효기간: <span className="text-white/80">{verifyResult.expiresAt}</span></p>
                <p>프로그램: <span className="text-white/80">{verifyResult.programName}</span></p>
              </div>
            </div>

            {verifyResult.isValid && (
              <button
                onClick={handleProceed}
                className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
              >
                결제 처리하기
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-v-md bg-white/10 text-white/70 text-sm transition-colors"
            >
              다시 스캔
            </button>
          </div>
        )}

        {scannedResult && !verifyResult && !loading && (
          <button
            onClick={handleReset}
            className="mt-4 px-5 py-2.5 rounded-v-md bg-white/10 text-white/70 text-sm transition-colors"
          >
            다시 스캔
          </button>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
