"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_DEMO_ATTESTORS } from "@/lib/web3/config";

export interface WalletState {
  address: string;
  role: "owner" | "beneficiary" | "attestor" | "stranger";
  isConnected: boolean;
  chainId: number;
  networkName: string;
}

interface Web3ContextType {
  wallet: WalletState;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchRole: (role: "owner" | "beneficiary" | "attestor_a" | "attestor_b" | "attestor_c" | "stranger") => void;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  switchNetwork: (chainId: number) => void;
}

const DEFAULT_OWNER_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const DEFAULT_BENEFICIARY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const Web3Context = createContext<Web3ContextType | null>(null);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: DEFAULT_OWNER_ADDR,
    role: "owner",
    isConnected: true,
    chainId: 31337,
    networkName: "Hardhat Localnet (Chain 31337)",
  });

  const [isDemoMode, setDemoMode] = useState<boolean>(true);

  // Check window.ethereum on mount
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWallet((prev) => ({
            ...prev,
            address: accounts[0],
            isConnected: true,
          }));
        }
      }).catch(() => {});
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        setWallet({
          address: accounts[0],
          role: "owner",
          isConnected: true,
          chainId: chainId,
          networkName: chainId === 97 ? "BNB Smart Chain Testnet" : `Chain ${chainId}`,
        });
      } catch (err) {
        console.error("User rejected connection", err);
      }
    } else {
      // Fallback connected demo wallet
      setWallet({
        address: DEFAULT_OWNER_ADDR,
        role: "owner",
        isConnected: true,
        chainId: 31337,
        networkName: "Hardhat Localnet (Demo Wallet)",
      });
    }
  };

  const disconnectWallet = () => {
    setWallet((prev) => ({
      ...prev,
      isConnected: false,
    }));
  };

  const switchRole = (roleKey: "owner" | "beneficiary" | "attestor_a" | "attestor_b" | "attestor_c" | "stranger") => {
    switch (roleKey) {
      case "owner":
        setWallet((prev) => ({ ...prev, address: DEFAULT_OWNER_ADDR, role: "owner", isConnected: true }));
        break;
      case "beneficiary":
        setWallet((prev) => ({ ...prev, address: DEFAULT_BENEFICIARY_ADDR, role: "beneficiary", isConnected: true }));
        break;
      case "attestor_a":
        setWallet((prev) => ({ ...prev, address: DEFAULT_DEMO_ATTESTORS[0].address, role: "attestor", isConnected: true }));
        break;
      case "attestor_b":
        setWallet((prev) => ({ ...prev, address: DEFAULT_DEMO_ATTESTORS[1].address, role: "attestor", isConnected: true }));
        break;
      case "attestor_c":
        setWallet((prev) => ({ ...prev, address: DEFAULT_DEMO_ATTESTORS[2].address, role: "attestor", isConnected: true }));
        break;
      case "stranger":
        setWallet((prev) => ({ ...prev, address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", role: "stranger", isConnected: true }));
        break;
    }
  };

  const switchNetwork = (chainId: number) => {
    setWallet((prev) => ({
      ...prev,
      chainId,
      networkName: chainId === 97 ? "BNB Smart Chain Testnet (97)" : "Hardhat Localnet (31337)",
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Context.Provider
        value={{
          wallet,
          connectWallet,
          disconnectWallet,
          switchRole,
          isDemoMode,
          setDemoMode,
          switchNetwork,
        }}
      >
        {children}
      </Web3Context.Provider>
    </QueryClientProvider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
