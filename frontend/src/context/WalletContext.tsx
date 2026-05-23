import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  clearToken,
  clearWallet,
  loadToken,
  loadWallet,
  saveToken,
  saveWallet,
} from "../services/auth/tokenStorage";

type Role = "user" | "merchant" | "admin" | null;

interface WalletContextType {
  walletAddress: string | null;
  nickname: string | null;
  role: Role;
  connectWallet: () => Promise<void>;
  setNickname: (name: string) => void;
  setRole: (role: "user" | "merchant" | "admin") => void;
  isConnected: boolean;
  disconnect: () => void;
  // ─── 신규 (JWT 인증) ──────────────────────────────────────────
  jwtToken: string | null;
  isAuthenticated: boolean;
  /** 로그인 성공 시 VoucherLogin이 호출. 토큰 + 지갑을 일괄 저장하고 컨텍스트 동기화. */
  loginSuccess: (jwt: string, walletAddress: string) => void;
  /** 토큰/지갑/역할을 모두 비우고 /login으로 보낸다. */
  logout: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // 초기값은 tokenStorage(=신규)와 기존 localStorage(=레거시 키) 둘 다 검사.
  // 두 키 사이의 동기화는 saveWallet/loadWallet이 담당. 레거시 페이지가 직접
  // localStorage.walletAddress를 읽을 수 있으니 부팅 시 보정해둔다.
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return loadWallet() ?? localStorage.getItem("walletAddress");
  });
  const [nickname, setNicknameState] = useState<string | null>(
    () => localStorage.getItem("nickname")
  );
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem("role") as Role) || null
  );
  const [jwtToken, setJwtToken] = useState<string | null>(() => loadToken());

  // 마운트 시점에 tokenStorage와 legacy localStorage를 한 번 더 정렬한다.
  useEffect(() => {
    const storedJwt = loadToken();
    const storedWallet = loadWallet();
    if (storedJwt && storedJwt !== jwtToken) setJwtToken(storedJwt);
    if (storedWallet && storedWallet !== walletAddress) {
      setWalletAddress(storedWallet);
      // legacy 키도 함께 채워둔다 (기존 페이지 호환)
      localStorage.setItem("walletAddress", storedWallet);
    }
    // 의존성: 부팅 시 1회만 동기화. eslint-disable는 의도적.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNickname = useCallback((name: string) => {
    setNicknameState(name);
    localStorage.setItem("nickname", name);
  }, []);

  const setRole = useCallback((r: "user" | "merchant" | "admin") => {
    setRoleState(r);
    localStorage.setItem("role", r);
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setNicknameState(null);
    setRoleState(null);
    setJwtToken(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("nickname");
    localStorage.removeItem("role");
    clearToken();
    clearWallet();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearWallet();
    setJwtToken(null);
    setWalletAddress("");
    setNicknameState(null);
    setRoleState(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("nickname");
    localStorage.removeItem("role");
    // BrowserRouter 외부에서도 동작하도록 location.assign 사용.
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }, []);

  const loginSuccess = useCallback((jwt: string, address: string) => {
    const lower = address.toLowerCase();
    saveToken(jwt);
    saveWallet(lower);
    localStorage.setItem("walletAddress", lower);
    setJwtToken(jwt);
    setWalletAddress(lower);
  }, []);

  const connectWallet = useCallback(async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      throw new Error("MetaMask가 설치되어 있지 않습니다. MetaMask를 먼저 설치해주세요.");
    }

    const accounts: string[] = await ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("지갑 연결에 실패했습니다.");
    }

    const address = accounts[0].toLowerCase();
    setWalletAddress(address);
    localStorage.setItem("walletAddress", address);
    saveWallet(address);
  }, []);

  // MetaMask 계정 변경 감지
  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const address = accounts[0].toLowerCase();
        setWalletAddress(address);
        localStorage.setItem("walletAddress", address);
        saveWallet(address);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        nickname,
        role,
        connectWallet,
        setNickname,
        setRole,
        isConnected: !!walletAddress,
        disconnect,
        jwtToken,
        isAuthenticated: !!jwtToken,
        loginSuccess,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
