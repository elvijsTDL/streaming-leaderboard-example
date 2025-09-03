"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import sdk from "@farcaster/frame-sdk";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  followerCount?: number;
  followingCount?: number;
  bio?: string;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isConnecting: boolean;
  isConnected: boolean;
  isInMiniApp: boolean;
  walletAddress: string | null;
  isWalletConnected: boolean;
  isWalletConnecting: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
  frameContext: any;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameContext, setFrameContext] = useState<any>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  // Wagmi hooks for wallet connection
  const { connect, connectors, isPending: isWalletConnecting } = useConnect();
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const isConnected = !!user;

  useEffect(() => {
    const checkMiniAppContext = async () => {
      try {
        const isMiniApp = await sdk.isInMiniApp();
        setIsInMiniApp(isMiniApp);

        if (isMiniApp) {
          const context = await sdk.context;
          console.log("🔍 Full Farcaster context:", context);
          console.log("👤 User data:", context?.user);
          console.log("🌐 Client info:", context?.client);
          console.log("📱 Location:", context?.location);
          
          if (context?.user) {
            setFrameContext(context);
            const farcasterUser: FarcasterUser = {
              fid: context.user.fid,
              username: context.user.username || undefined,
              displayName: context.user.displayName || undefined,
              pfpUrl: context.user.pfpUrl || undefined,
              // Note: follower counts and bio aren't available in frame context
              // They would need to be fetched separately from Farcaster API
            };
            console.log("✅ Processed Farcaster user:", farcasterUser);
            setUser(farcasterUser);
          }
        }
      } catch (err) {
        console.warn("Could not initialize Farcaster Frame SDK:", err);
        setIsInMiniApp(false);
      }
    };

    checkMiniAppContext();
  }, []);

  const signIn = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (isInMiniApp && frameContext?.user) {
        const farcasterUser: FarcasterUser = {
          fid: frameContext.user.fid,
          username: frameContext.user.username || undefined,
          displayName: frameContext.user.displayName || undefined,
          pfpUrl: frameContext.user.pfpUrl || undefined,
        };
        console.log("🔗 Manual sign in - using existing context:", farcasterUser);
        setUser(farcasterUser);
      } else {
        // Fallback for non-MiniApp environments (for development/testing)
        setError("Farcaster connection is only available in MiniApp environment");
        console.log("❌ Not in MiniApp or no frame context available");
      }
    } catch (err) {
      setError("Failed to connect to Farcaster");
      console.error("Farcaster connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const signOut = () => {
    setUser(null);
    console.log("🚪 User signed out");
  };

  const connectWallet = async () => {
    if (!isInMiniApp) {
      setError("Wallet connection through frame is only available in MiniApp environment");
      return;
    }

    try {
      // Find the Farcaster MiniApp connector following the official guide
      const miniAppConnector = connectors.find(
        (connector) => connector.id === "farcasterMiniApp"
      );

      if (miniAppConnector) {
        console.log("🔗 Connecting wallet via Farcaster MiniApp connector");
        await connect({ connector: miniAppConnector });
      } else {
        setError("Farcaster MiniApp connector not available");
        console.error("❌ Farcaster MiniApp connector not found");
        console.log("Available connectors:", connectors.map(c => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      setError("Failed to connect wallet through frame");
      console.error("Wallet connection error:", err);
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      console.log("🔌 Wallet disconnected");
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
    }
  };

  return (
    <FarcasterContext.Provider value={{ 
      user, 
      isConnecting, 
      isConnected, 
      isInMiniApp, 
      walletAddress: walletAddress ?? null,
      isWalletConnected,
      isWalletConnecting,
      signIn, 
      signOut, 
      connectWallet,
      disconnectWallet,
      error, 
      frameContext 
    }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}



