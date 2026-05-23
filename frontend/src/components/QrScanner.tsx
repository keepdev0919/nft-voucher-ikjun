/**
 * 사용자가 가맹점 QR을 스캔할 때 사용.
 * onScan에서 받은 raw 문자열을 JSON.parse해서 paymentId 등 추출.
 * HTTPS 환경에서만 카메라 권한이 허용됨 (localhost 또는 ngrok 등).
 *
 * 사용 예:
 *   const [paused, setPaused] = useState(false);
 *   <QrScanner
 *     paused={paused}
 *     onScan={(raw) => {
 *       const data = JSON.parse(raw);
 *       setPaused(true); // 중복 스캔 방지
 *       processPayment(data);
 *     }}
 *     onError={(e) => console.warn(e)}
 *   />
 *
 * 모바일에서는 후면 카메라(environment)가 기본 선택됨.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { QrScanner as YudielQrScanner } from "@yudiel/react-qr-scanner";

export interface QrScannerProps {
  /** 스캔 성공 시 호출 — 인자는 디코딩된 raw 문자열 */
  onScan: (data: string) => void;
  /** 에러 핸들러 (선택) */
  onError?: (err: Error) => void;
  /** true면 스캔 중단 (성공 후 중복 발사 방지용으로 부모가 제어) */
  paused?: boolean;
  /** 외부 컨테이너에 적용할 className */
  className?: string;
}

type PermissionState = "checking" | "granted" | "denied";

export default function QrScanner({
  onScan,
  onError,
  paused = false,
  className = "",
}: QrScannerProps) {
  const [permission, setPermission] = useState<PermissionState>("checking");
  const [retryKey, setRetryKey] = useState(0);
  // 동일 페이로드가 빠르게 연속 발사되는 것을 막기 위한 디바운스
  const lastScanRef = useRef<{ data: string; at: number } | null>(null);

  // 카메라 권한 요청
  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("denied");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        // 권한 확인 후 즉시 트랙 정리 — 실제 스트림은 라이브러리가 다시 요청
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) setPermission("granted");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPermission("denied");
          onError?.(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey, onError]);

  const handleDecode = useCallback(
    (result: string) => {
      if (paused || !result) return;

      // 동일 페이로드가 800ms 안에 또 들어오면 무시 (라이브러리 자체 스캔 주기 보강)
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.data === result && now - last.at < 800) return;
      lastScanRef.current = { data: result, at: now };

      onScan(result);
    },
    [onScan, paused]
  );

  const handleError = useCallback(
    (err: Error) => {
      onError?.(err);
    },
    [onError]
  );

  // 권한 거부 안내
  if (permission === "denied") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-v-lg bg-v-errorLight border border-v-error/30 text-center ${className}`}
      >
        <p className="text-sm text-v-error font-medium">
          카메라 권한이 필요합니다.
        </p>
        <p className="text-xs text-v-textSecondary">
          브라우저 설정에서 카메라 접근을 허용한 뒤 다시 시도해 주세요. (HTTPS 또는 localhost에서만 동작)
        </p>
        <button
          type="button"
          onClick={() => {
            setPermission("checking");
            setRetryKey((k) => k + 1);
          }}
          className="mt-1 px-4 py-2 rounded-v-md bg-v-accent text-white text-sm font-medium hover:bg-v-accentHover transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 권한 체크 중
  if (permission === "checking") {
    return (
      <div
        className={`flex items-center justify-center p-6 rounded-v-lg bg-v-surface2 text-v-textSecondary text-sm ${className}`}
      >
        카메라 권한 확인 중...
      </div>
    );
  }

  // 스캐너 본체 + 모서리 브래킷 데코
  return (
    <div
      className={`relative w-full overflow-hidden rounded-v-lg bg-black shadow-v-md ${className}`}
    >
      <YudielQrScanner
        onDecode={handleDecode}
        onError={handleError}
        constraints={{ facingMode: "environment" }}
        scanDelay={300}
        hideCount
        containerStyle={{
          width: "100%",
          paddingTop: 0,
        }}
        videoStyle={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* 모서리 브래킷 오버레이 (장식용) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-2/3 aspect-square">
          {/* 좌상 */}
          <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
          {/* 우상 */}
          <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
          {/* 좌하 */}
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
          {/* 우하 */}
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-md" />
        </div>
      </div>

      {paused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-v-md bg-white/90 text-v-text text-xs font-medium">
            스캔 일시중지됨
          </span>
        </div>
      )}
    </div>
  );
}
