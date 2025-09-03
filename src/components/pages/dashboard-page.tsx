import { useEffect, useState } from "react";
import { UserProfileCard } from "../user-profile-card";
import { TokenStatsCard } from "../token-stats-card";
import { useFarcaster } from "../../hooks/use-farcaster";
import { useWallet } from "../../hooks/use-wallet";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, formatFlowRatePerDay, formatTokenAmount, fetchTokenStatistics, type TokenStatistics } from "../../lib/superfluid";

export function DashboardPage() {
  // Get all data from hooks instead of props
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

  // Local state for token stats
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

  // Fetch token stats
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <UserProfileCard
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
        frameWalletAddress={frameWalletAddress}
        frameWalletConnected={frameWalletConnected}
        frameWalletConnecting={frameWalletConnecting}
        frameConnectWallet={frameConnectWallet}
        frameDisconnectWallet={frameDisconnectWallet}
      />

      <TokenStatsCard
        tokenStats={tokenStats}
        TOKEN_SYMBOL={TOKEN_SYMBOL}
        fullTokenStats={fullTokenStats}
      />      
    </div>
  );
}
