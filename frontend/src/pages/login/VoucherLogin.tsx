import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { checkUser, registerNickname } from "../../services/voucherApi";
import Toast from "../../components/Toast";

type Step = "connect" | "nickname" | "role";

const ROLE_OPTIONS = [
  {
    key: "user" as const,
    label: "사용자",
    desc: "바우처를 발급받아 사용합니다",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    path: "/voucher/home",
  },
  {
    key: "merchant" as const,
    label: "가맹점",
    desc: "바우처를 스캔하고 결제를 처리합니다",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
    path: "/merchant/home",
  },
  {
    key: "admin" as const,
    label: "기관",
    desc: "바우처 프로그램을 생성하고 발급합니다",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    path: "/admin/home",
  },
];

export default function VoucherLogin() {
  const navigate = useNavigate();
  const { connectWallet, walletAddress, setNickname, setRole } = useWallet();

  const [step, setStep] = useState<Step>("connect");
  const [nicknameInput, setNicknameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectWallet();
      // connectWallet 이후 walletAddress가 업데이트되기까지 약간의 시간이 걸릴 수 있어
      // 직접 ethereum accounts를 가져옴
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_accounts",
      });
      const address = accounts[0]?.toLowerCase();
      if (!address) throw new Error("지갑 주소를 가져올 수 없습니다.");

      // 기존 사용자 확인
      try {
        const res = await checkUser(address);
        const userData = res.data;
        if (userData?.nickname) {
          setNickname(userData.nickname);
          setStep("role");
        } else {
          setStep("nickname");
        }
      } catch (e: any) {
        // 404 = 신규 사용자
        if (e?.response?.status === 404) {
          setStep("nickname");
        } else {
          // 서버 오류여도 닉네임 입력으로 진행
          setStep("nickname");
        }
      }
    } catch (err: any) {
      showToast(err?.message ?? "지갑 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameSubmit = async () => {
    if (!nicknameInput.trim()) {
      showToast("닉네임을 입력해주세요.");
      return;
    }
    if (!walletAddress) {
      showToast("지갑 주소를 찾을 수 없습니다. 다시 연결해주세요.");
      return;
    }
    setLoading(true);
    try {
      await registerNickname(walletAddress, nicknameInput.trim());
      setNickname(nicknameInput.trim());
      setStep("role");
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "닉네임 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: "user" | "merchant" | "admin", path: string) => {
    setRole(role);
    navigate(path, { replace: true });
  };

  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans flex flex-col">
      {/* 배경 장식 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 320, height: 320, top: -100, right: -80, background: "rgba(37,99,235,0.07)" }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 200, height: 200, bottom: 60, left: -60, background: "rgba(37,99,235,0.05)" }}
      />

      <div className="flex-1 flex flex-col justify-center px-6">
        {/* 로고 영역 */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-v-lg mb-4" style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" className="w-9 h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
          </div>
          <h1 className="text-[26px] font-bold text-v-text">NFT 바우처</h1>
          <p className="text-sm text-v-textMuted mt-1">블록체인 기반 바우처 시스템</p>
        </div>

        {/* Step 1: 지갑 연결 */}
        {step === "connect" && (
          <div className="space-y-4">
            <p className="text-center text-v-textMuted text-sm mb-6">
              MetaMask 지갑을 연결하여 시작하세요
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                  <rect width="40" height="40" rx="8" fill="#F6851B" />
                  <path d="M32 9L22.5 16l1.8-4.2L32 9z" fill="#E2761B" />
                  <path d="M8 9l9.4 7.1-1.7-4.2L8 9z" fill="#E4761B" />
                </svg>
              )}
              {loading ? "연결 중..." : "MetaMask 연결"}
            </button>
          </div>
        )}

        {/* Step 2: 닉네임 입력 */}
        {step === "nickname" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-v-text font-semibold">닉네임을 입력해주세요</p>
              <p className="text-xs text-v-textMuted mt-1">서비스에서 사용할 이름입니다</p>
            </div>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNicknameSubmit()}
              placeholder="닉네임 입력 (최대 20자)"
              maxLength={20}
              className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
            />
            <button
              onClick={handleNicknameSubmit}
              disabled={loading || !nicknameInput.trim()}
              className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : "다음"}
            </button>
          </div>
        )}

        {/* Step 3: 역할 선택 */}
        {step === "role" && (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-v-text font-semibold">역할을 선택해주세요</p>
              <p className="text-xs text-v-textMuted mt-1">사용 목적에 맞는 역할을 선택하세요</p>
            </div>
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleRoleSelect(option.key, option.path)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-v-lg bg-v-surface border border-v-border active:border-v-accent active:bg-v-accentLight transition-colors text-left"
              >
                <div className="text-v-accent">{option.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-v-text">{option.label}</p>
                  <p className="text-xs text-v-textMuted mt-0.5">{option.desc}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-v-textMuted ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
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
