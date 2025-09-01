import { useEffect, useState, useMemo } from "react";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, fetchTopFlowRateLeaders, fetchTopVolumeLeadersWithStreaming, formatFlowRatePerDay, formatTokenAmount, type VolumeLeaderboardEntry } from "../lib/superfluid";
import { resolveManyProfiles, type ResolvedProfile } from "../lib/whois";
import { shortenAddress } from "../lib/utils";
import { StreamingBalance } from "./streaming-balance";

const PAGE_SIZE = 10;

interface LeaderboardCardProps {
  className?: string;
  address: string | null;
  copiedAddress: string | null;
  handleCopyAddress: (address: string) => void;
}

export function LeaderboardCard({
  className = "",
  address,
  copiedAddress,
  handleCopyAddress,
}: LeaderboardCardProps) {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"flow" | "volume">("flow");
  const [page, setPage] = useState(0);
  const [flowLeaders, setFlowLeaders] = useState<Array<{ address: string; perDay: string }>>([]);
  const [volumeLeaders, setVolumeLeaders] = useState<Array<{ address: string; amount: string }>>([]);
  const [volumeStreamingLeaders, setVolumeStreamingLeaders] = useState<VolumeLeaderboardEntry[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [hasNextFlow, setHasNextFlow] = useState(false);
  const [hasNextVolume, setHasNextVolume] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLeaders(true);
    Promise.all([
      fetchTopFlowRateLeaders(TOKEN_ADDRESS, PAGE_SIZE + 1, page * PAGE_SIZE),
      fetchTopVolumeLeadersWithStreaming(TOKEN_ADDRESS, PAGE_SIZE + 1, page * PAGE_SIZE),
    ]).then(async ([flowRes, volumeStreamingRes]) => {
      if (cancelled) return;
      
      const flowData = flowRes.slice(0, PAGE_SIZE);
      const volumeStreamingData = volumeStreamingRes.slice(0, PAGE_SIZE);
      
            // Map the data to the expected format
      const mappedFlowData = flowData.map((e) => ({ 
        address: e.account, 
        perDay: formatFlowRatePerDay(e.value) 
      }));
      const mappedVolumeData = volumeStreamingData.map((e) => ({
        address: e.account,
        amount: formatTokenAmount(e.totalAmountStreamedUntilUpdatedAt)
      }));

      setFlowLeaders(mappedFlowData);
      setVolumeLeaders(mappedVolumeData);
      setVolumeStreamingLeaders(volumeStreamingData);
      setHasNextFlow(flowRes.length > PAGE_SIZE);
      setHasNextVolume(volumeStreamingRes.length > PAGE_SIZE);

      // Get unique addresses from both lists
      const allAddresses = [...new Set([
        ...mappedFlowData.map(entry => entry.address.toLowerCase()),
        ...mappedVolumeData.map(entry => entry.address.toLowerCase())
      ])];

      if (allAddresses.length > 0) {
        try {
          const resolvedProfiles = await resolveManyProfiles(allAddresses);
          if (!cancelled) {
            setProfiles(resolvedProfiles);
          }
        } catch (error) {
          console.error("Error resolving profiles:", error);
        }
      }
      
      setIsLoadingLeaders(false);
    }).catch(() => {
      if (!cancelled) {
        setIsLoadingLeaders(false);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [page]);

  const displayEntries = useMemo(() => {
    const rankOffset = page * PAGE_SIZE;
    if (activeLeaderboardTab === "flow") {
      return flowLeaders.map((entry, idx) => ({
        rank: rankOffset + idx + 1,
        address: entry.address,
        value: `${entry.perDay} ${TOKEN_SYMBOL}`,
        isYou: address && entry.address.toLowerCase() === address.toLowerCase(),
        streamingData: null,
      }));
    }
    return volumeLeaders.map((entry, idx) => {
      const streamingEntry = volumeStreamingLeaders[idx];
      return {
        rank: rankOffset + idx + 1,
        address: entry.address,
        value: `${entry.amount} ${TOKEN_SYMBOL}`,
        isYou: address && entry.address.toLowerCase() === address.toLowerCase(),
        streamingData: streamingEntry,
      };
    });
  }, [activeLeaderboardTab, flowLeaders, volumeLeaders, volumeStreamingLeaders, address, page]);

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold theme-text-primary">TOKEN LEADERBOARD ({TOKEN_SYMBOL})</h2>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`px-3 py-1 rounded border ${activeLeaderboardTab === "flow" ? "theme-button text-black theme-border" : "bg-transparent theme-text-primary theme-border"}`}
            style={{borderWidth: '1px'}}
            onClick={() => setActiveLeaderboardTab("flow")}
          >
            Flow Rate
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded border ${activeLeaderboardTab === "volume" ? "theme-button text-black theme-border" : "bg-transparent theme-text-primary theme-border"}`}
            style={{borderWidth: '1px'}}
            onClick={() => setActiveLeaderboardTab("volume")}
          >
            Volume
          </button>
        </div>
      </div>

      {isLoadingLeaders ? (
        <div className="theme-text-muted text-center py-8">Loading leaderboard…</div>
      ) : displayEntries.length > 0 ? (
        <div className="space-y-3">
          {displayEntries.map((entry) => {
            const p = profiles[entry.address.toLowerCase()];
            const name = p?.recommendedName || p?.ENS?.handle || p?.Farcaster?.handle || shortenAddress(entry.address);
            const avatar = p?.recommendedAvatar || p?.Farcaster?.avatarUrl || p?.ENS?.avatarUrl || "/placeholder.svg";
            return (
            <div key={`${activeLeaderboardTab}-${entry.rank}-${entry.address}`} className={`flex items-center justify-between p-3 rounded ${entry.isYou ? "theme-button border theme-border" : "theme-card-bg"}`} style={entry.isYou ? {borderWidth: '1px'} : {}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">#{entry.rank}</div>
                <img src={avatar} alt="avatar" className="w-6 h-6 rounded-full border theme-border" />
                <div className="flex-1 min-w-0">
                  <div className="theme-text-primary font-medium">{name}</div>
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
                {entry.isYou && <span className="text-xs theme-button text-black px-2 py-1 rounded font-bold">YOU</span>}
              </div>
              <div className="text-right">
                <div className="theme-text-primary font-bold">
                  {entry.streamingData ? (
                    <StreamingBalance
                      initialBalance={entry.streamingData.totalAmountStreamedUntilUpdatedAt}
                      initialTimestamp={entry.streamingData.updatedAtTimestamp}
                      flowRatePerSecond={entry.streamingData.totalOutflowRate}
                      symbol={TOKEN_SYMBOL}
                      decimalPlaces={2}
                    />
                  ) : (
                    entry.value
                  )}
                </div>
                <div className="theme-text-muted text-xs">{activeLeaderboardTab === "flow" ? "per day" : "total streamed"}</div>
              </div>
            </div>
            );
          })}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={`px-3 py-1 rounded border ${page === 0 ? "theme-border theme-text-muted" : "theme-border theme-text-primary hover:theme-button hover:text-black"}`}
              style={{borderWidth: '1px'}}
            >
              Prev
            </button>
            <div className="text-xs theme-text-secondary">Page {page + 1}</div>
            <button
              type="button"
              disabled={activeLeaderboardTab === "flow" ? !hasNextFlow : !hasNextVolume}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3 py-1 rounded border ${(activeLeaderboardTab === "flow" ? !hasNextFlow : !hasNextVolume) ? "theme-border theme-text-muted" : "theme-border theme-text-primary hover:theme-button hover:text-black"}`}
              style={{borderWidth: '1px'}}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="theme-text-muted text-center py-8">No data</div>
      )}
    </div>
  );
}
