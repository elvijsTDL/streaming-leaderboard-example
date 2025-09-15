import { useEffect, useState } from "react";
import { fetchCFAStreams, type CFAStream, formatFlowRatePerDay, TOKEN_ADDRESS, TOKEN_SYMBOL } from "../../lib/superfluid";
import { resolveManyProfiles, type ResolvedProfile } from "../../lib/whois";
import { shortenAddress } from "../../lib/utils";
import { StreamingBalance } from "../streaming-balance";
import { StreamCreateCard } from "../stream-create-card";

const PAGE_SIZE = 20;

export function StreamsPage() {
  const [streams, setStreams] = useState<CFAStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    
    fetchCFAStreams(TOKEN_ADDRESS, PAGE_SIZE + 1, page * PAGE_SIZE).then(async (result) => {
      if (cancelled) return;
      
      const streamsData = result.slice(0, PAGE_SIZE);
      setStreams(streamsData);
      setHasNextPage(result.length > PAGE_SIZE);

      // Get unique addresses from streams
      const allAddresses = [...new Set([
        ...streamsData.map(stream => stream.sender.toLowerCase()),
        ...streamsData.map(stream => stream.receiver.toLowerCase())
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
      
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [page]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getDisplayName = (address: string) => {
    const profile = profiles[address.toLowerCase()];
    return profile?.recommendedName || profile?.ENS?.handle || profile?.Farcaster?.handle || shortenAddress(address);
  };

  const getAvatar = (address: string) => {
    const profile = profiles[address.toLowerCase()];
    return profile?.recommendedAvatar || profile?.Farcaster?.avatarUrl || profile?.ENS?.avatarUrl || "/placeholder.svg";
  };

  return (
    <div className="space-y-6">
      <StreamCreateCard />
      <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold theme-text-primary">Latest CFA Streams</h2>
        </div>

        {isLoading ? (
          <div className="theme-text-muted text-center py-12">Loading streams…</div>
        ) : streams.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="theme-border border-b">
                    <th className="text-left py-3 px-2 theme-text-secondary font-semibold">Sender</th>
                    <th className="text-left py-3 px-2 theme-text-secondary font-semibold">Receiver</th>
                    <th className="text-left py-3 px-2 theme-text-secondary font-semibold">Flow Rate</th>
                    <th className="text-left py-3 px-2 theme-text-secondary font-semibold">Sent</th>
                    <th className="text-left py-3 px-2 theme-text-secondary font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((stream) => (
                    <tr key={stream.id} className="theme-border border-b border-opacity-30 hover:theme-card-bg">
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          <img src={getAvatar(stream.sender)} alt="Sender" className="w-8 h-8 rounded-full border theme-border" />
                          <div>
                            <div className="theme-text-primary font-medium">{getDisplayName(stream.sender)}</div>
                            <div className="theme-text-muted text-xs font-mono">{shortenAddress(stream.sender)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          <img src={getAvatar(stream.receiver)} alt="Receiver" className="w-8 h-8 rounded-full border theme-border" />
                          <div>
                            <div className="theme-text-primary font-medium">{getDisplayName(stream.receiver)}</div>
                            <div className="theme-text-muted text-xs font-mono">{shortenAddress(stream.receiver)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="theme-text-primary font-bold">
                          {formatFlowRatePerDay(stream.currentFlowRate)}
                        </div>
                        <div className="theme-text-muted text-xs">per day</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="theme-text-primary font-bold">
                          <StreamingBalance
                            initialBalance="0"
                            initialTimestamp={stream.createdAtTimestamp}
                            flowRatePerSecond={stream.currentFlowRate}
                            symbol={TOKEN_SYMBOL}
                            decimalPlaces={3}
                          />
                        </div>
                        <div className="theme-text-muted text-xs">total sent</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="theme-text-secondary text-sm">
                          {formatTimestamp(stream.updatedAtTimestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {streams.map((stream) => (
                <div key={stream.id} className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="space-y-3">
                    {/* Sender */}
                    <div className="flex items-center space-x-3">
                      <img src={getAvatar(stream.sender)} alt="Sender" className="w-10 h-10 rounded-full border theme-border" />
                      <div className="flex-1">
                        <div className="theme-text-secondary text-xs">From</div>
                        <div className="theme-text-primary font-medium">{getDisplayName(stream.sender)}</div>
                        <div className="theme-text-muted text-xs font-mono">{shortenAddress(stream.sender)}</div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="text-center theme-text-muted">↓</div>
                    
                    {/* Receiver */}
                    <div className="flex items-center space-x-3">
                      <img src={getAvatar(stream.receiver)} alt="Receiver" className="w-10 h-10 rounded-full border theme-border" />
                      <div className="flex-1">
                        <div className="theme-text-secondary text-xs">To</div>
                        <div className="theme-text-primary font-medium">{getDisplayName(stream.receiver)}</div>
                        <div className="theme-text-muted text-xs font-mono">{shortenAddress(stream.receiver)}</div>
                      </div>
                    </div>
                    
                    {/* Flow Rate and Details */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t theme-border">
                      <div>
                        <div className="theme-text-secondary text-xs">Flow Rate</div>
                        <div className="theme-text-primary font-bold">{formatFlowRatePerDay(stream.currentFlowRate)}</div>
                        <div className="theme-text-muted text-xs">per day</div>
                      </div>
                      <div>
                        <div className="theme-text-secondary text-xs">Sent</div>
                        <div className="theme-text-primary font-bold">
                          <StreamingBalance
                            initialBalance="0"
                            initialTimestamp={stream.createdAtTimestamp}
                            flowRatePerSecond={stream.currentFlowRate}
                            symbol={TOKEN_SYMBOL}
                            decimalPlaces={2}
                          />
                        </div>
                        <div className="theme-text-muted text-xs">total</div>
                      </div>
                      <div>
                        <div className="theme-text-secondary text-xs">Updated</div>
                        <div className="theme-text-primary text-sm">{formatTimestamp(stream.updatedAtTimestamp)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-6 border-t theme-border">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`px-4 py-2 rounded-lg border ${page === 0 ? "theme-border theme-text-muted" : "theme-border theme-text-primary hover:theme-button hover:text-black"}`}
                style={{borderWidth: '1px'}}
              >
                Previous
              </button>
              <div className="text-sm theme-text-secondary">Page {page + 1}</div>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className={`px-4 py-2 rounded-lg border ${!hasNextPage ? "theme-border theme-text-muted" : "theme-border theme-text-primary hover:theme-button hover:text-black"}`}
                style={{borderWidth: '1px'}}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="theme-text-muted text-center py-12">No active streams found</div>
        )}
      </div>
    </div>
  );
}
