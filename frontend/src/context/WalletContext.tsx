import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(
    () => localStorage.getItem("walletAddress")
  );
  const [nickname, setNicknameState] = useState<string | null>(
    () => localStorage.getItem("nickname")
  );
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem("role") as Role) || null
  );

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
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("nickname");
    localStorage.removeItem("role");
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
