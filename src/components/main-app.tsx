"use client";

import { useEffect, useState } from "react";
import { FarcasterProvider, useFarcaster } from "../hooks/use-farcaster";
import { WalletProvider, useWallet } from "../hooks/use-wallet";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, formatFlowRatePerDay, formatTokenAmount, fetchTokenStatistics, type TokenStatistics } from "../lib/superfluid";

import { Navigation, type PageType } from "./navigation";
import { DashboardPage } from "./pages/dashboard-page";
import { LeaderboardPage } from "./pages/leaderboard-page";
import { StreamsPage } from "./pages/streams-page";
import { EventsPage } from "./pages/events-page";
import { AnalyticsPage } from "./pages/analytics-page";

function MainView() {
  const { 
    user: farcasterUser, 
    isConnected: isFarcasterConnected, 
    signIn: farcasterSignIn, 
    signOut: farcasterSignOut, 
    isConnecting: isFarcasterConnecting, 
    isInMiniApp,
    walletAddress: frameWalletAddress,
    isWalletConnected: frameWalletConnected,
    isWalletConnecting: frameWalletConnecting,
    connectWallet: frameConnectWallet,
    disconnectWallet: frameDisconnectWallet
  } = useFarcaster();
  const { address, isConnected: isWalletConnected, totalVolumeStreamed } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('stats');

  const handleCopyAddress = async (addressToCopy: string) => {
    try {
      await navigator.clipboard.writeText(addressToCopy);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = addressToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };


  const [tokenStats, setTokenStats] = useState<{
    activeStreams: number;
    activeCFAStreams: number;
    activeGDAStreams: number;
    totalPools: number;
    totalIndexes: number;
    holders: number;
    accounts: number;
    totalOutflowPerDay: string;
    totalCFAPerDay: string;
    totalGDAOutflowPerDay: string;
    totalStreamed: string;
    totalSupply: string;
  } | null>(null);
  
  const [fullTokenStats, setFullTokenStats] = useState<TokenStatistics | null>(null);



  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await fetchTokenStatistics(TOKEN_ADDRESS);
        if (cancelled || !stats) return;
        
        // Save full stats for streaming calculations
        setFullTokenStats(stats);
        
        const totalOutflowPerDay = formatFlowRatePerDay(stats.totalOutflowRate);
        const totalCFAPerDay = formatFlowRatePerDay(stats.totalCFAOutflowRate);
        const totalGDAOutflowPerDay = formatFlowRatePerDay(stats.totalGDAOutflowRate);
        const totalStreamed = formatTokenAmount(stats.totalAmountStreamedUntilUpdatedAt);
        const totalSupply = formatTokenAmount(stats.totalSupply);
        setTokenStats({
          activeStreams: stats.totalNumberOfActiveStreams,
          activeCFAStreams: stats.totalCFANumberOfActiveStreams,
          activeGDAStreams: stats.totalGDANumberOfActiveStreams,
          totalPools: stats.totalNumberOfPools,
          totalIndexes: stats.totalNumberOfIndexes,
          holders: stats.totalNumberOfHolders,
          accounts: stats.totalNumberOfAccounts,
          totalOutflowPerDay,
          totalCFAPerDay,
          totalGDAOutflowPerDay,
          totalStreamed,
          totalSupply,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);



  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'stats':
        return (
          <DashboardPage
            isFarcasterConnected={isFarcasterConnected}
            farcasterUser={farcasterUser}
            farcasterSignOut={farcasterSignOut}
            farcasterSignIn={farcasterSignIn}
            isFarcasterConnecting={isFarcasterConnecting}
            isInMiniApp={isInMiniApp}
            isWalletConnected={isWalletConnected}
            address={address}
            totalVolumeStreamed={totalVolumeStreamed}
            TOKEN_SYMBOL={TOKEN_SYMBOL}
            tokenStats={tokenStats}
            fullTokenStats={fullTokenStats}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardPage
            address={address}
            copiedAddress={copiedAddress}
            handleCopyAddress={handleCopyAddress}
          />
        );
      case 'streams':
        return <StreamsPage />;
      case 'events':
        return <EventsPage />;
      case 'trading':
        return <AnalyticsPage />;
      default:
        return <DashboardPage
          isFarcasterConnected={isFarcasterConnected}
          farcasterUser={farcasterUser}
          farcasterSignOut={farcasterSignOut}
          farcasterSignIn={farcasterSignIn}
          isFarcasterConnecting={isFarcasterConnecting}
          isInMiniApp={isInMiniApp}
          isWalletConnected={isWalletConnected}
          address={address}
          totalVolumeStreamed={totalVolumeStreamed}
          TOKEN_SYMBOL={TOKEN_SYMBOL}
          tokenStats={tokenStats}
          fullTokenStats={fullTokenStats}
        />;
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text-primary font-mono">
      <div className="container mx-auto px-4 py-8">
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />   
        {renderCurrentPage()}
      </div>
    </div>
  );
}

export default function MainApp() {
  return (
    <FarcasterProvider>
      <WalletProvider>
        <MainView />
      </WalletProvider>
    </FarcasterProvider>
  );
}


