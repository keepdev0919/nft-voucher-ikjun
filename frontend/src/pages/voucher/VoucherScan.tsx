import React, { useState } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";

export default function VoucherScan() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = (result: string) => {
    setScannedResult(result);
    setError(null);
    // TODO: 백엔드 연동 시 tokenId 파싱 후 처리
    // const tokenId = JSON.parse(result)?.tokenId;
    // navigate(`/voucher/list/${tokenId}`);
  };

  const handleError = (err: Error) => {
    setError("카메라 접근 권한이 필요합니다.");
    console.error(err);
  };

  return (
    <div className="h-full bg-[#0D0D18] flex flex-col">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 pt-2">
        <h1 className="text-xl font-semibold text-white">QR 스캔</h1>
        <p className="text-[13px] text-white/45 mt-0.5">가맹점의 QR 코드를 카메라에 비춰주세요</p>
      </div>

      {/* 스캐너 뷰파인더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        <div className="relative w-64 h-64 rounded-v-md overflow-hidden">
          {!error ? (
            <QrScanner
              onDecode={handleDecode}
              onError={handleError}
              containerStyle={{ width: "100%", height: "100%" }}
              videoStyle={{ objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-v-md">
              <div className="text-center px-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white/30 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                </svg>
                <p className="text-white/50 text-xs">{error}</p>
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

        {/* 스캔 결과 */}
        {scannedResult && (
          <div className="mt-4 w-full max-w-xs bg-white/8 rounded-v-md p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <p className="text-white text-sm font-medium">스캔 완료</p>
            </div>
            <p className="text-white/50 text-xs font-mono break-all">{scannedResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
