import { useYoinkStats, useIsYoinkEnabled, useSharedYoinkDetails } from "../hooks/queries/use-yoink-data";
import { isSharedYoinkEnabled } from "../lib/yoink-contracts";
import { TOKEN_SYMBOL } from "../lib/superfluid";

interface YoinkStatsCardProps {
  className?: string;
}

export function YoinkStatsCard({ className = "" }: YoinkStatsCardProps) {
  const { data: stats, isLoading } = useYoinkStats();
  const { data: sharedYoinkDetails, isLoading: sharedLoading } = useSharedYoinkDetails();
  const isYoinkEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  if (!isYoinkEnabled) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">YOINK STATS</h2>
        <div className="text-center">
          <p className="theme-text-secondary">
            Yoink stats available on Optimism Sepolia testnet.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || (isSharedEnabled && sharedLoading)) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">
          {isSharedEnabled ? "SHARED YOINK STATS" : "YOINK STATS"}
        </h2>
        <div className="text-center">
          <p className="theme-text-secondary">Loading stats...</p>
        </div>
      </div>
    );
  }

  // Show free-for-all yoink stats if enabled
  if (isSharedEnabled && sharedYoinkDetails) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">FREE-FOR-ALL STATS</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm">Yoink Status</div>
            <div className={`font-bold text-lg ${sharedYoinkDetails.isActive ? 'text-green-400' : 'text-red-400'}`}>
              {sharedYoinkDetails.isActive ? "LIVE" : "OFFLINE"}
            </div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm">Flow Rate</div>
            <div className="theme-text-primary font-bold text-lg">
              {sharedYoinkDetails.isActive 
                ? `${(Number(sharedYoinkDetails.flowRate) / 10**18 * 86400).toFixed(2)}/day`
                : "0/day"
              }
            </div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm">Current Recipient</div>
            <div className="theme-text-primary font-mono text-sm">
              {sharedYoinkDetails.recipient === "0x0000000000000000000000000000000000000000" 
                ? "No recipient - Available to yoink!" 
                : `${sharedYoinkDetails.recipient.slice(0, 8)}...${sharedYoinkDetails.recipient.slice(-6)}`
              }
            </div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm">Token</div>
            <div className="theme-text-primary font-mono text-sm">
              {sharedYoinkDetails.token.slice(0, 8)}...{sharedYoinkDetails.token.slice(-6)}
            </div>
          </div>
        </div>
        <div className="text-xs theme-text-muted mt-4">
          * Live free-for-all yoink data from Optimism Sepolia
        </div>
      </div>
    );
  }

  // Show individual yoink stats
  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">YOINK STATS</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Total Yoinks</div>
          <div className="theme-text-primary font-bold text-lg">{stats?.totalYoinks || 0}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Active Streams</div>
          <div className="theme-text-primary font-bold text-lg">{stats?.activeStreams || 0}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Total Value Streamed</div>
          <div className="theme-text-primary font-bold text-xl">{stats?.totalValueStreamed || "0"} {TOKEN_SYMBOL}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Total Flow Rate</div>
          <div className="theme-text-primary font-bold text-xl">{stats?.totalFlowRate || "0"} {TOKEN_SYMBOL}/day</div>
        </div>
      </div>
      <div className="text-xs theme-text-muted mt-4">
        * Live data from Optimism Sepolia
      </div>
    </div>
  );
}
