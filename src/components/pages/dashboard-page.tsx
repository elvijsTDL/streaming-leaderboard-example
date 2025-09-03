import { UserProfileCard } from "../user-profile-card";
import { TokenStatsCard } from "../token-stats-card";
import { type TokenStatistics } from "../../lib/superfluid";

interface DashboardPageProps {
  // User profile props
  isFarcasterConnected: boolean;
  farcasterUser: any;
  farcasterSignOut: () => void;
  farcasterSignIn: () => void;
  isFarcasterConnecting: boolean;
  isInMiniApp: boolean;
  isWalletConnected: boolean;
  address: string | null;
  totalVolumeStreamed: string;
  TOKEN_SYMBOL: string;
  // Token stats props
  tokenStats: any;
  fullTokenStats?: TokenStatistics | null;
}

export function DashboardPage({
  isFarcasterConnected,
  farcasterUser,
  farcasterSignOut,
  farcasterSignIn,
  isFarcasterConnecting,
  isInMiniApp,
  isWalletConnected,
  address,
  totalVolumeStreamed,
  TOKEN_SYMBOL,
  tokenStats,
  fullTokenStats,
}: DashboardPageProps) {
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
      />

      <TokenStatsCard
        tokenStats={tokenStats}
        TOKEN_SYMBOL={TOKEN_SYMBOL}
        fullTokenStats={fullTokenStats}
      />      
    </div>
  );
}
