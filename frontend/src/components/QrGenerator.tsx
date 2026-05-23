/**
 * 가맹점이 결제 요청 QR을 띄울 때 사용.
 * payload엔 보통 { merchantWallet, amount, paymentId, deadline } 4개 필드가 들어감.
 * 페이로드 크기가 너무 크면(>2KB) 스캔 인식률이 떨어지므로 짧게 유지할 것.
 *
 * 예시:
 *   <QrGenerator
 *     payload={{ merchantWallet: "0x...", amount: 5000, paymentId: "abc", deadline: 1737000000 }}
 *     size={280}
 *   />
 *
 * 문자열을 그대로 넘기는 것도 가능:
 *   <QrGenerator payload="https://example.com/pay/abc" />
 */

import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface QrGeneratorProps {
  /** 인코딩할 데이터. 객체면 자동으로 JSON.stringify 처리 */
  payload: string | Record<string, any>;
  /** QR 한 변 픽셀 크기 (기본 256) */
  size?: number;
  /** 오류 정정 레벨 (기본 "M") — L/M/Q/H 순으로 복원력 증가 */
  level?: "L" | "M" | "Q" | "H";
  /** 컨테이너에 추가할 className */
  className?: string;
  /** 배경색 (기본 흰색) */
  bgColor?: string;
  /** 전경색 (기본 검정) */
  fgColor?: string;
}

export default function QrGenerator({
  payload,
  size = 256,
  level = "M",
  className = "",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
}: QrGeneratorProps) {
  // 객체면 stringify, 문자열이면 그대로
  const encoded = useMemo<string>(
    () => (typeof payload === "string" ? payload : JSON.stringify(payload)),
    [payload]
  );

  // 디버깅용: UTF-8 바이트 크기 측정 (TextEncoder 미지원 환경 대비 fallback)
  const byteSize = useMemo<number>(() => {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(encoded).length;
    }
    return encoded.length;
  }, [encoded]);

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 p-4 rounded-v-lg bg-v-surface shadow-v-sm ${className}`}
    >
      <QRCodeSVG
        value={encoded}
        size={size}
        level={level}
        bgColor={bgColor}
        fgColor={fgColor}
        marginSize={2}
      />
      <span className="text-xs font-mono text-v-textMuted select-none">
        {byteSize} bytes
      </span>
    </div>
  );
}
