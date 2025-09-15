import { useState } from "react";
import { shortenAddress } from "../lib/utils";
import { TOKEN_SYMBOL } from "../lib/superfluid";

interface YoinkLeaderboardEntry {
  address: string;
  totalYoinked: string;
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

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">{title}</h2>
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div key={entry.address} className="flex items-center justify-between p-3 rounded theme-card-bg border theme-border" style={{borderWidth: '1px'}}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-xs sm:text-sm">
                #{entry.rank}
              </div>
              <img 
                src="/placeholder.svg" 
                alt="avatar" 
                className="w-6 h-6 rounded-full border theme-border" 
              />
              <div className="flex-1 min-w-0">
                <div className="theme-text-primary font-medium">
                  {shortenAddress(entry.address)}
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
                {entry.totalYoinked} {TOKEN_SYMBOL}
              </div>
              <div className="theme-text-muted text-xs">total yoinked</div>
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
