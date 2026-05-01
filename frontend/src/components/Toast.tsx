import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "error", onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const colors: Record<string, string> = {
    error: "bg-red-500",
    success: "bg-emerald-500",
    info: "bg-v-accent",
  };

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-v-lg text-white text-sm font-medium shadow-v-md max-w-xs text-center ${colors[type]}`}
      style={{ minWidth: 180 }}
    >
      {message}
    </div>
  );
}
