import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import {
  checkMemberExists,
  getMember,
  registerMerchant,
  registerUser,
  MemberResponse,
} from "../../services/voucherApi";
import { getNonce, verifyLogin } from "../../services/auth/authApi";
import { signLoginMessage } from "../../services/web3/signLoginMessage";
import { ensureGanacheNetwork } from "../../services/web3/network";
import Toast from "../../components/Toast";

type Step = "connect" | "nickname" | "role" | "category" | "signing";

const CATEGORY_OPTIONS = [
  { key: "일반 음식점", label: "일반 음식점", icon: "🍽️" },
  { key: "영화관", label: "영화관", icon: "🎬" },
  { key: "카페", label: "카페", icon: "☕" },
  { key: "편의점", label: "편의점", icon: "🏪" },
];

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
  },
];

/**
 * 로그인 플로우 상태 머신
 *
 *   connect ──(미가입)──▶ nickname ──▶ role ──(user)──▶ signing ──▶ /voucher/home
 *      │                                    └──(merchant)──▶ category ──▶ signing ──▶ /merchant/home
 *      └──(기가입)──────────────────────────────────────────▶ signing ──▶ role별 홈
 *
 * signing 단계는 백엔드 nonce → personal_sign → verify → JWT 저장.
 * MetaMask가 서명을 거부하면 직전 입력 단계(nickname/role)로 되돌린다.
 */
export default function VoucherLogin() {
  const navigate = useNavigate();
  const {
    setNickname,
    setRole,
    isAuthenticated,
    loginSuccess,
    role: contextRole,
  } = useWallet();

  // 로컬 상태로 지갑 주소를 관리해 setState 비동기성 이슈를 피한다.
  // (connectWallet 직후 walletAddress가 아직 업데이트 안된 상태에서 nonce를 호출하면 안 됨)
  const [localWallet, setLocalWallet] = useState<string>("");
  const [step, setStep] = useState<Step>("connect");
  const [nicknameInput, setNicknameInput] = useState("");
  const [pendingRole, setPendingRole] = useState<"user" | "merchant" | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
  };

  // 이미 로그인된 상태로 /login에 들어오면 역할별 홈으로 보낸다.
  useEffect(() => {
    if (isAuthenticated) {
      const r = contextRole ?? (localStorage.getItem("role") as "user" | "merchant" | "admin" | null);
      if (r === "merchant") navigate("/merchant/home", { replace: true });
      else if (r === "admin") navigate("/admin/home", { replace: true });
      else navigate("/voucher/home", { replace: true });
    }
    // 마운트 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 공통 서명/검증/저장 루틴.
   * @param address  소문자 지갑 주소
   * @param targetRole 성공 시 라우팅할 역할 (user → /voucher/home, merchant → /merchant/home)
   * @param fallbackStep 서명 실패 시 되돌아갈 단계
   */
  const doSignAndVerify = async (
    address: string,
    targetRole: "user" | "merchant" | "admin",
    fallbackStep: Step
  ) => {
    setStep("signing");
    try {
      const nonce = await getNonce(address);
      const signature = await signLoginMessage(address, nonce);
      const jwt = await verifyLogin(address, signature);

      // 컨텍스트와 localStorage 동기화
      loginSuccess(jwt, address);
      setRole(targetRole);

      // 라우팅
      if (targetRole === "merchant") navigate("/merchant/home", { replace: true });
      else if (targetRole === "admin") navigate("/admin/home", { replace: true });
      else navigate("/voucher/home", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "로그인에 실패했습니다.";
      showToast(msg);
      setStep(fallbackStep);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // 1) Ganache 네트워크 강제 (MetaMask가 메인넷이면 자동 전환)
      try {
        await ensureGanacheNetwork();
      } catch (e) {
        // 사용자 거부여도 일단 다음 단계로. 서명 단계에서 어차피 실패하면 알린다.
        console.warn("[VoucherLogin] ensureGanacheNetwork 실패:", e);
      }

      // 2) 계정 요청
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("MetaMask가 설치되어 있지 않습니다.");
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0]?.toLowerCase();
      if (!address) throw new Error("지갑 주소를 가져올 수 없습니다.");
      setLocalWallet(address);

      // 3) 가입 여부 조회
      const exists = await checkMemberExists(address);
      if (exists) {
        // 기존 회원 — getMember로 role/nickname 가져온 뒤 바로 서명 단계로
        try {
          const member: MemberResponse = await getMember(address);
          if (member.nickname) setNickname(member.nickname);
          const apiRole: "user" | "merchant" | "admin" =
            member.role === "MERCHANT" ? "merchant" :
            member.role === "ADMIN" ? "admin" : "user";
          setRole(apiRole);
          await doSignAndVerify(address, apiRole, "connect");
        } catch (e: any) {
          showToast(e?.response?.data?.message ?? "회원 정보 조회에 실패했습니다.");
        }
      } else {
        // 신규 회원 — 닉네임 입력으로 이동
        setStep("nickname");
      }
    } catch (err: any) {
      // MetaMask 거부 (code 4001) 또는 기타
      const code = err?.code;
      if (code === 4001) {
        showToast("사용자가 연결을 거부했습니다.");
      } else {
        showToast(err?.message ?? "지갑 연결에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameSubmit = () => {
    if (!nicknameInput.trim()) {
      showToast("닉네임을 입력해주세요.");
      return;
    }
    // 닉네임만 잠시 보관 — 실제 등록은 역할 선택 후 수행 (USER/MERCHANT 엔드포인트가 다름)
    setStep("role");
  };

  const handleRoleSelect = async (selected: "user" | "merchant") => {
    setPendingRole(selected);
    if (selected === "merchant") {
      setStep("category");
      return;
    }
    // USER — 즉시 등록 후 서명
    await registerAndSign("user", null);
  };

  const handleCategorySelect = async (category: string) => {
    localStorage.setItem("merchantCategory", category);
    await registerAndSign("merchant", category);
  };

  /**
   * 닉네임/역할/(카테고리)이 모두 정해지면 백엔드 등록 → 서명.
   */
  const registerAndSign = async (
    targetRole: "user" | "merchant",
    category: string | null
  ) => {
    if (!localWallet) {
      showToast("지갑 주소를 찾을 수 없습니다. 처음부터 다시 시도해주세요.");
      setStep("connect");
      return;
    }
    const nick = nicknameInput.trim();
    if (!nick) {
      showToast("닉네임이 비어 있습니다.");
      setStep("nickname");
      return;
    }

    setLoading(true);
    try {
      if (targetRole === "merchant") {
        if (!category) {
          showToast("카테고리를 선택해주세요.");
          setStep("category");
          return;
        }
        await registerMerchant({
          walletAddress: localWallet,
          nickname: nick,
          category,
        });
      } else {
        await registerUser({
          walletAddress: localWallet,
          nickname: nick,
        });
      }
      setNickname(nick);
      setRole(targetRole);
      // 등록 성공 — 이제 서명/검증
      const fallback: Step = targetRole === "merchant" ? "category" : "role";
      await doSignAndVerify(localWallet, targetRole, fallback);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "회원 등록에 실패했습니다.";
      showToast(msg);
      // 등록 실패 — 역할/카테고리 단계로 복귀
      setStep(targetRole === "merchant" ? "category" : "role");
    } finally {
      setLoading(false);
    }
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
                onClick={() => handleRoleSelect(option.key)}
                disabled={loading}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-v-lg bg-v-surface border border-v-border active:border-v-accent active:bg-v-accentLight transition-colors text-left disabled:opacity-60"
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

        {/* Step 4: 가맹점 카테고리 선택 */}
        {step === "category" && (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-v-text font-semibold">가맹점 카테고리를 선택해주세요</p>
              <p className="text-xs text-v-textMuted mt-1">해당하는 업종을 선택하세요</p>
            </div>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat.key)}
                disabled={loading}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-v-lg bg-v-surface border border-v-border active:border-v-accent active:bg-v-accentLight transition-colors text-left disabled:opacity-60"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-sm font-semibold text-v-text">{cat.label}</p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-v-textMuted ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
            <button
              onClick={() => setStep("role")}
              disabled={loading}
              className="w-full py-3 text-sm text-v-textMuted disabled:opacity-60"
            >
              뒤로
            </button>
          </div>
        )}

        {/* Step 5: 서명 로딩 */}
        {step === "signing" && (
          <div className="space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-full border-4 border-v-accent/20 border-t-v-accent animate-spin" />
            <div>
              <p className="text-v-text font-semibold">서명 요청 중...</p>
              <p className="text-xs text-v-textMuted mt-1.5">
                MetaMask 팝업에서 메시지에 서명해주세요
              </p>
              <p className="text-[11px] text-v-textMuted mt-2 leading-relaxed">
                서명은 가스비가 들지 않으며, 본인 확인 용도로만 사용됩니다.
              </p>
            </div>
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
