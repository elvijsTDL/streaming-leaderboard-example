"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isConnecting: boolean;
  isConnected: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!user;

  const signIn = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockUser: FarcasterUser = {
        fid: 12345,
        username: "matrixuser",
        displayName: "Matrix User",
        pfpUrl: "/placeholder.svg?height=40&width=40",
        followerCount: 1337,
        followingCount: 420,
      };

      setUser(mockUser);
      localStorage.setItem("farcaster-user", JSON.stringify(mockUser));
    } catch {
      setError("Failed to connect to Farcaster");
    } finally {
      setIsConnecting(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("farcaster-user");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("farcaster-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("farcaster-user");
      }
    }
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isConnecting, isConnected, signIn, signOut, error }}>
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



