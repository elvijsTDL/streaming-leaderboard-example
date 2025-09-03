import { useMemo } from "react";
import { UserProfileCard } from "../user-profile-card";
import { TokenStatsCard } from "../token-stats-card";
import { useFarcaster } from "../../hooks/use-farcaster";

import { useTokenStatistics } from "../../hooks/queries/use-token-statistics";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, formatFlowRatePerDay, formatTokenAmount } from "../../lib/superfluid";

export function DashboardPage() {
  const { 
    user: farcasterUser, 
    isConnected: isFarcasterConnected, 
    signIn: farcasterSignIn, 
    isConnecting: isFarcasterConnecting, 
    isInMiniApp,
  } = useFarcaster();

  // Use the new token statistics hook
  const { data: fullTokenStats } = useTokenStatistics(TOKEN_ADDRESS);

  // Memoize the formatted token stats
  const tokenStats = useMemo(() => {
    if (!fullTokenStats) return null;

    const totalOutflowPerDay = formatFlowRatePerDay(fullTokenStats.totalOutflowRate);
    const totalCFAPerDay = formatFlowRatePerDay(fullTokenStats.totalCFAOutflowRate);
    const totalGDAOutflowPerDay = formatFlowRatePerDay(fullTokenStats.totalGDAOutflowRate);
    const totalStreamed = formatTokenAmount(fullTokenStats.totalAmountStreamedUntilUpdatedAt);
    const totalSupply = formatTokenAmount(fullTokenStats.totalSupply);

    return {
      activeStreams: fullTokenStats.totalNumberOfActiveStreams,
      activeCFAStreams: fullTokenStats.totalCFANumberOfActiveStreams,
      activeGDAStreams: fullTokenStats.totalGDANumberOfActiveStreams,
      totalPools: fullTokenStats.totalNumberOfPools,
      totalIndexes: fullTokenStats.totalNumberOfIndexes,
      holders: fullTokenStats.totalNumberOfHolders,
      accounts: fullTokenStats.totalNumberOfAccounts,
      totalOutflowPerDay,
      totalCFAPerDay,
      totalGDAOutflowPerDay,
      totalStreamed,
      totalSupply,
    };
  }, [fullTokenStats]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <UserProfileCard
        isFarcasterConnected={isFarcasterConnected}
        farcasterUser={farcasterUser}
        farcasterSignIn={farcasterSignIn}
        isFarcasterConnecting={isFarcasterConnecting}
        isInMiniApp={isInMiniApp}
        TOKEN_SYMBOL={TOKEN_SYMBOL}
      />

      <TokenStatsCard
        tokenStats={tokenStats}
        TOKEN_SYMBOL={TOKEN_SYMBOL}
        fullTokenStats={fullTokenStats}
      />      
    </div>
  );
}
