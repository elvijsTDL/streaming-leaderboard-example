import { useState, useEffect } from "react";
import { shortenAddress } from "../lib/utils";
import { TOKEN_SYMBOL } from "../lib/superfluid";
import { resolveAddressProfile, ResolvedProfile } from "../lib/whois";

interface YoinkLeaderboardEntry {
  address: string;
  totalYoinked: string;
  totalReceived: string;
  lastYoinkTime: number;
  isCurrentlyReceiving: boolean;
  currentFlowRate: string;
  rank: number;
}

interface YoinkLeaderboardCardProps {
  className?: string;
  leaderboard: YoinkLeaderboardEntry[];
  title?: string;
  showMockNotice?: boolean;
}

export function YoinkLeaderboardCard({ 
  className = "", 
  leaderboard, 
  title = "TOP YOINKERS",
  showMockNotice = true 
}: YoinkLeaderboardCardProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Load profiles for all addresses
  useEffect(() => {
    if (leaderboard.length === 0) return;
    
    setLoadingProfiles(true);
    const addresses = leaderboard.map(entry => entry.address);
    
    // Resolve profiles individually to handle CORS properly
    const loadProfiles = async () => {
      console.log("Loading profiles for addresses:", addresses);
      const profilePromises = addresses.map(async (address) => {
        try {
          const profile = await resolveAddressProfile(address);
          console.log(`Resolved profile for ${address}:`, profile);
          return [address, profile] as const;
        } catch (error) {
          console.warn(`Failed to resolve profile for ${address}:`, error);
          return [address, { address }] as const;
        }
      });
      
      const results = await Promise.all(profilePromises);
      const profilesMap = Object.fromEntries(results);
      console.log("Final profiles map:", profilesMap);
      setProfiles(profilesMap);
    };
    
    loadProfiles()
      .catch(console.error)
      .finally(() => setLoadingProfiles(false));
  }, [leaderboard]);

  const formatTimeAgo = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatFlowRate = (flowRate: string) => {
    const rate = Number(flowRate);
    if (rate === 0) return "0";
    return `${(rate / 10**18 * 86400).toFixed(6)} ${TOKEN_SYMBOL}/day`;
  };

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">{title}</h2>
      {loadingProfiles && (
        <div className="text-center py-4">
          <div className="theme-text-muted text-sm">Loading profiles...</div>
        </div>
      )}
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div key={entry.address} className="flex items-center justify-between p-3 rounded theme-card-bg border theme-border" style={{borderWidth: '1px'}}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-xs sm:text-sm">
                #{entry.rank}
              </div>
              <img 
                src={profiles[entry.address]?.recommendedAvatar || "/placeholder.svg"} 
                alt="avatar" 
                className="w-6 h-6 rounded-full border theme-border" 
              />
              <div className="flex-1 min-w-0">
                <div className="theme-text-primary font-medium">
                  {profiles[entry.address]?.recommendedName || shortenAddress(entry.address)}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAddress(entry.address)}
                  className="flex items-center gap-1 theme-text-secondary text-xs hover:theme-text-primary transition-colors cursor-pointer group max-w-full"
                  title="Click to copy address"
                >
                  <span className="font-mono">{shortenAddress(entry.address)}</span>
                  <span className="text-[10px] opacity-60 group-hover:opacity-100 flex-shrink-0">
                    {copiedAddress === entry.address ? '✓' : '📋'}
                  </span>
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="theme-text-primary font-bold">
                {entry.totalYoinked} yoinks
              </div>
              <div className="theme-text-muted text-xs">
                {entry.totalReceived && Number(entry.totalReceived) > 0 
                  ? `${(Number(entry.totalReceived) / 10**18).toFixed(4)} ${TOKEN_SYMBOL} received`
                  : "No tokens received"
                }
              </div>
              <div className="theme-text-muted text-xs">
                {formatTimeAgo(entry.lastYoinkTime)}
              </div>
              {entry.isCurrentlyReceiving && (
                <div className="text-green-400 text-xs font-medium">
                  🔄 Receiving {formatFlowRate(entry.currentFlowRate)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showMockNotice && (
        <div className="mt-4 text-center">
          <div className="text-xs theme-text-muted">
            * Mock data - real leaderboard coming with contract deployment
          </div>
        </div>
      )}
    </div>
  );
}
