import { useState } from "react";
import { Button } from "./ui/button";
import { shortenAddress } from "../lib/utils";
import { useUserProfile } from "../hooks/use-user-profile";
import { useBalance, useAccount } from "wagmi";
import { TOKEN_ADDRESS } from "../lib/superfluid";
import { useAccountStreamingData } from "../hooks/queries/use-account-streaming";
import { formatUnits } from "viem";
import { StreamingBalance } from "./streaming-balance";

interface UserProfileCardProps {
  className?: string;
  isFarcasterConnected: boolean;
  farcasterUser: any;
  farcasterSignIn: () => void;
  isFarcasterConnecting: boolean;
  isInMiniApp: boolean;
  TOKEN_SYMBOL: string;
}

export function UserProfileCard({
  className = "",
  isFarcasterConnected,
  farcasterUser,
  farcasterSignIn,
  isFarcasterConnecting,
  isInMiniApp,
  TOKEN_SYMBOL,
}: UserProfileCardProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  
  const { profile: whoisProfile, chainStats, loading: userStatsLoading } = useUserProfile();

  const { data: streamingData } = useAccountStreamingData(
    TOKEN_ADDRESS, 
    isConnected && address ? address : null
  );

  const { data: tokenBalance, isLoading: isBalanceLoading } = useBalance({
    address: address as `0x${string}`,
    token: TOKEN_ADDRESS as `0x${string}`,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const formattedTokenBalance = tokenBalance 
    ? Number(formatUnits(tokenBalance.value, tokenBalance.decimals)).toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      })
    : "0";

  const handleCopyAddress = (addressToCopy: string) => {
    navigator.clipboard.writeText(addressToCopy);
    setCopiedAddress(addressToCopy);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Shared streaming stats component - ONLY ONE VERSION!
  const StreamingStatsSection = () => (
    <div className="space-y-3">
      <div className="theme-text-primary font-semibold text-sm border-b theme-border pb-1">STREAMING STATS</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary">Flow Rank</div>
          <div className="theme-text-primary font-bold">{chainStats?.flowRank ? `#${chainStats.flowRank}` : (userStatsLoading ? "..." : "—")}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary">Volume Rank</div>
          <div className="theme-text-primary font-bold">{chainStats?.volumeRank ? `#${chainStats.volumeRank}` : (userStatsLoading ? "..." : "—")}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary">{TOKEN_SYMBOL} Balance</div>
          <div className="theme-text-primary font-bold">
            {isConnected ? (
              isBalanceLoading ? "..." : `${formattedTokenBalance} ${TOKEN_SYMBOL}`
            ) : `0 ${TOKEN_SYMBOL}`}
          </div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary">Flow Rate/day</div>
          <div className="theme-text-primary font-bold">
            {isConnected ? (
              userStatsLoading ? "..." : (chainStats?.currentFlowPerDayToken ? `${chainStats.currentFlowPerDayToken} ${TOKEN_SYMBOL}` : `0 ${TOKEN_SYMBOL}`)
            ) : `0 ${TOKEN_SYMBOL}`}
          </div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary">Total Streamed</div>
          <div className="theme-text-primary font-bold">
            {isConnected && streamingData ? (
              <StreamingBalance
                initialBalance={streamingData.totalAmountStreamedUntilUpdatedAt}
                initialTimestamp={streamingData.updatedAtTimestamp}
                flowRatePerSecond={streamingData.totalOutflowRate}
                decimals={18}
                symbol={TOKEN_SYMBOL}
                className="font-bold"
                decimalPlaces={3}
              />
            ) : (
              userStatsLoading ? "..." : `0.000 ${TOKEN_SYMBOL}`
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">USER PROFILE</h2>
      
      {/* Profile Section */}
      <div className="space-y-4">
        {isFarcasterConnected && farcasterUser ? (
          // Farcaster Profile
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <img src={farcasterUser.pfpUrl || "/placeholder.svg"} alt="Profile" className="w-12 h-12 rounded-full border-2 theme-border" />
              <div className="flex-1">
                <div className="theme-text-primary font-bold text-lg">{farcasterUser.displayName || "Farcaster User"}</div>
                <div className="theme-text-secondary text-sm">@{farcasterUser.username || "user"}</div>
                <div className="theme-text-muted text-xs">FID: {farcasterUser.fid}</div>
              </div>
            </div>
            
            {/* Farcaster Social Stats */}
            {(farcasterUser.followerCount !== undefined || farcasterUser.followingCount !== undefined) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="theme-text-secondary">Followers</div>
                  <div className="theme-text-primary font-bold">{farcasterUser.followerCount?.toLocaleString() || "—"}</div>
                </div>
                <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="theme-text-secondary">Following</div>
                  <div className="theme-text-primary font-bold">{farcasterUser.followingCount?.toLocaleString() || "—"}</div>
                </div>
              </div>
            )}
            
            {/* Show wallet address if connected */}
            {isConnected && address && (
              <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                <div className="theme-text-secondary text-sm mb-1">Connected Wallet</div>
                <button
                  type="button"
                  onClick={() => handleCopyAddress(address)}
                  className="flex items-center gap-2 theme-text-primary hover:theme-text-secondary transition-colors cursor-pointer group font-mono text-sm"
                  title="Click to copy address"
                >
                  <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                  <span className="text-xs opacity-60 group-hover:opacity-100">
                    {copiedAddress === address ? '✓' : '📋'}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : isConnected && address ? (
          // Regular Wallet Profile
          <div className="flex items-center space-x-3">
            <img src={whoisProfile?.recommendedAvatar || whoisProfile?.Farcaster?.avatarUrl || whoisProfile?.ENS?.avatarUrl || "/placeholder.svg"} alt="Profile" className="w-10 h-10 rounded-full border theme-border" />
            <div className="flex-1">
              <div className="theme-text-primary font-bold">{whoisProfile?.recommendedName || whoisProfile?.ENS?.handle || whoisProfile?.Farcaster?.handle || shortenAddress(address)}</div>
              <button
                type="button"
                onClick={() => handleCopyAddress(address)}
                className="flex items-center gap-1 theme-text-secondary text-xs hover:theme-text-primary transition-colors cursor-pointer group"
                title="Click to copy address"
              >
                <span className="font-mono">{shortenAddress(address)}</span>
                <span className="text-[10px] opacity-60 group-hover:opacity-100">
                  {copiedAddress === address ? '✓' : '📋'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          // Disconnected State
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className="text-red-400">DISCONNECTED</span>
            </div>
            
            {/* Show Farcaster button only in MiniApp, AppKit button otherwise */}
            {isInMiniApp ? (
              <div className="space-y-3">
                <Button onClick={farcasterSignIn} disabled={isFarcasterConnecting} className="w-full theme-button text-black font-bold">
                  {isFarcasterConnecting ? "CONNECTING..." : "CONNECT FARCASTER"}
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <appkit-button />
              </div>
            )}
          </div>
        )}

        {/* Shared Streaming Stats - Only show when wallet is connected */}
        {isConnected && address && <StreamingStatsSection />}
      </div>
    </div>
  );
}
