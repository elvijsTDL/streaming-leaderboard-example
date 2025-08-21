"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";

interface TokenBalance {
  symbol: string;
  balance: string;
  value: string;
  contractAddress: string;
}

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  tokenBalances: TokenBalance[];
  ethBalance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
  refreshBalances: () => Promise<void>;
  flowRate: string; // e.g., "0.012 ETH/day"
  totalVolumeStreamed: string; // e.g., "5.40 ETH"
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnecting, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [ethBalance, setEthBalance] = useState("0.0");
  const [error, setError] = useState<string | null>(null);
  const [flowRate, setFlowRate] = useState<string>("0.000 ETH/day");
  const [totalVolumeStreamed, setTotalVolumeStreamed] = useState<string>("0.000 ETH");

  const connectWallet = async () => {
    setError(null);
    // Programmatically open Reown AppKit modal by clicking hidden web component
    const el = document.getElementById("wallet-open-button");
    if (el) {
      (el as HTMLElement).click();
    } else {
      setError("Wallet UI not available");
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
    } catch {
      // noop
    }
    setTokenBalances([]);
    setEthBalance("0.0");
  };

  const fetchMockBalances = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockBalances: TokenBalance[] = [
      { symbol: "DEGEN", balance: "1,337.42", value: "$420.69", contractAddress: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" },
      { symbol: "HIGHER", balance: "888.88", value: "$177.76", contractAddress: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe" },
      { symbol: "TN100x", balance: "100.00", value: "$1,000.00", contractAddress: "0x5B5dee44Ad5914834c0f0b4e8e8b7d1b5c5b5b5b" },
    ];

    setTokenBalances(mockBalances);
    setEthBalance("1.2345");
  };

  const refreshBalances = async () => {
    if (address) {
      await fetchMockBalances();
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      void fetchMockBalances();
      // Mock streaming stats until backend/SDK is wired
      setFlowRate("0.012 ETH/day");
      setTotalVolumeStreamed("5.40 ETH");
    } else {
      setTokenBalances([]);
      setEthBalance("0.0");
      setFlowRate("0.000 ETH/day");
      setTotalVolumeStreamed("0.000 ETH");
    }
  }, [isConnected, address]);

  return (
    <WalletContext.Provider
      value={{ address: address ?? null, isConnecting, isConnected, tokenBalances, ethBalance, connectWallet, disconnectWallet, error, refreshBalances, flowRate, totalVolumeStreamed }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}



