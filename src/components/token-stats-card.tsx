import { StreamingBalance } from "./streaming-balance";
import { type TokenStatistics } from "../lib/superfluid";

interface TokenStats {
  activeCFAStreams: number;
  activeGDAStreams: number;
  totalOutflowPerDay: string;
  totalGDAOutflowPerDay: string;
  totalStreamed: string;
  totalSupply: string;
  totalPools: number;
  totalIndexes: number;
  holders: number;
  accounts: number;
}

interface TokenStatsCardProps {
  className?: string;
  tokenStats: TokenStats | null;
  TOKEN_SYMBOL: string;
  fullTokenStats?: TokenStatistics | null;
}

export function TokenStatsCard({
  className = "",
  tokenStats,
  TOKEN_SYMBOL,
  fullTokenStats,
}: TokenStatsCardProps) {
  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">TOKEN STATS</h2>
      {tokenStats && (
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Active Streams (CFA)</div>
            <div className="theme-text-primary font-bold">{tokenStats.activeCFAStreams}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Active Streams (GDA)</div>
            <div className="theme-text-primary font-bold">{tokenStats.activeGDAStreams}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Total Outflow/day (CFA)</div>
            <div className="theme-text-primary font-bold">{tokenStats.totalOutflowPerDay} {TOKEN_SYMBOL}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Total Outflow/day (GDA)</div>
            <div className="theme-text-primary font-bold">{tokenStats.totalGDAOutflowPerDay} {TOKEN_SYMBOL}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Total Streamed</div>
            <div className="theme-text-primary font-bold">
              {fullTokenStats ? (
                <StreamingBalance
                  initialBalance={fullTokenStats.totalAmountStreamedUntilUpdatedAt}
                  initialTimestamp={fullTokenStats.updatedAtTimestamp}
                  flowRatePerSecond={fullTokenStats.totalOutflowRate}
                  symbol={TOKEN_SYMBOL}
                  className="font-bold"
                />
              ) : (
                `${tokenStats.totalStreamed} ${TOKEN_SYMBOL}`
              )}
            </div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Total Supply</div>
            <div className="theme-text-primary font-bold">{tokenStats.totalSupply} {TOKEN_SYMBOL}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Pools / Indexes</div>
            <div className="theme-text-primary font-bold">{tokenStats.totalPools} / {tokenStats.totalIndexes}</div>
          </div>
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary">Holders / Accounts</div>
            <div className="theme-text-primary font-bold">{tokenStats.holders} / {tokenStats.accounts}</div>
          </div>
        </div>
      )}
    </div>
  );
}
