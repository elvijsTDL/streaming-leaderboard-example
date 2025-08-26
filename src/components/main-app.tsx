"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { FarcasterProvider, useFarcaster } from "../hooks/use-farcaster";
import { useUserProfile } from "../hooks/use-user-profile";
import { WalletProvider, useWallet } from "../hooks/use-wallet";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, fetchTopFlowRateLeaders, fetchTopVolumeLeaders, formatFlowRatePerDay, formatTokenAmount, fetchTokenStatistics } from "../lib/superfluid";
import { resolveManyProfiles, type ResolvedProfile } from "../lib/whois";
import { TokenChart } from "./token-chart";
import { StremeCard } from "./streme-card";
import { EventsCard } from "./events-card";
import { shortenAddress } from "../lib/utils";

function MainView() {
  const { user: farcasterUser, isConnected: isFarcasterConnected, signIn: farcasterSignIn, signOut: farcasterSignOut, isConnecting: isFarcasterConnecting } = useFarcaster();
  const { address, isConnected: isWalletConnected, flowRate, totalVolumeStreamed } = useWallet();
  const { profile: whoisProfile, chainStats, loading: userStatsLoading } = useUserProfile();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (addressToCopy: string) => {
    try {
      await navigator.clipboard.writeText(addressToCopy);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = addressToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"flow" | "volume">("flow");

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [flowLeaders, setFlowLeaders] = useState<Array<{ address: string; perDay: string }>>([]);
  const [volumeLeaders, setVolumeLeaders] = useState<Array<{ address: string; amount: string }>>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [hasNextFlow, setHasNextFlow] = useState(false);
  const [hasNextVolume, setHasNextVolume] = useState(false);
  const [tokenStats, setTokenStats] = useState<{
    activeStreams: number;
    activeCFAStreams: number;
    totalPools: number;
    totalIndexes: number;
    holders: number;
    accounts: number;
    totalOutflowPerDay: string;
    totalCFAPerDay: string;
    totalStreamed: string;
    totalSupply: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLeaders(true);
    Promise.all([
      fetchTopFlowRateLeaders(TOKEN_ADDRESS, PAGE_SIZE + 1, page * PAGE_SIZE),
      fetchTopVolumeLeaders(TOKEN_ADDRESS, PAGE_SIZE + 1, page * PAGE_SIZE),
    ])
      .then(async ([flow, volume]) => {
        if (cancelled) return;
        setHasNextFlow(flow.length > PAGE_SIZE);
        setHasNextVolume(volume.length > PAGE_SIZE);
        const flowPage = flow.slice(0, PAGE_SIZE);
        const volumePage = volume.slice(0, PAGE_SIZE);
        setFlowLeaders(flowPage.map((e) => ({ address: e.account, perDay: formatFlowRatePerDay(e.value) })));
        setVolumeLeaders(volumePage.map((e) => ({ address: e.account, amount: formatTokenAmount(e.value) })));
        const addresses = Array.from(new Set([...flowPage.map((e) => e.account), ...volumePage.map((e) => e.account)]));
        const resolved = await resolveManyProfiles(addresses);
        if (!cancelled) setProfiles(resolved);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLeaders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await fetchTokenStatistics(TOKEN_ADDRESS);
        if (cancelled || !stats) return;
        const totalOutflowPerDay = formatFlowRatePerDay(stats.totalOutflowRate);
        const totalCFAPerDay = formatFlowRatePerDay(stats.totalCFAOutflowRate);
        const totalStreamed = formatTokenAmount(stats.totalAmountStreamedUntilUpdatedAt);
        const totalSupply = formatTokenAmount(stats.totalSupply);
        setTokenStats({
          activeStreams: stats.totalNumberOfActiveStreams,
          activeCFAStreams: stats.totalCFANumberOfActiveStreams,
          totalPools: stats.totalNumberOfPools,
          totalIndexes: stats.totalNumberOfIndexes,
          holders: stats.totalNumberOfHolders,
          accounts: stats.totalNumberOfAccounts,
          totalOutflowPerDay,
          totalCFAPerDay,
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

  const displayEntries = useMemo(() => {
    const rankOffset = page * PAGE_SIZE;
    if (activeLeaderboardTab === "flow") {
      return flowLeaders.map((entry, idx) => ({
        rank: rankOffset + idx + 1,
        address: entry.address,
        value: `${entry.perDay} ${TOKEN_SYMBOL}/day`,
        isYou: address && entry.address.toLowerCase() === address.toLowerCase(),
      }));
    }
    return volumeLeaders.map((entry, idx) => ({
      rank: rankOffset + idx + 1,
      address: entry.address,
              value: `${entry.amount} ${TOKEN_SYMBOL}`,
      isYou: address && entry.address.toLowerCase() === address.toLowerCase(),
    }));
  }, [activeLeaderboardTab, flowLeaders, volumeLeaders, address, page]);

  return (
    <div className="min-h-screen theme-bg theme-text-primary font-mono">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 theme-text-primary">The ${TOKEN_SYMBOL} Token Matrix</h1>
          <p className="theme-text-secondary">Your one stop shop for all ${TOKEN_SYMBOL} things </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
            <h2 className="text-xl font-bold mb-4 theme-text-primary">USER PROFILE</h2>
            {isFarcasterConnected && farcasterUser ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img src={farcasterUser.pfpUrl || "/placeholder.svg"} alt="Profile" className="w-10 h-10 rounded-full border theme-border" />
                  <div>
                    <div className="theme-text-primary font-bold">@{farcasterUser.username}</div>
                    <div className="theme-text-secondary text-sm">{farcasterUser.displayName}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="theme-card-bg rounded p-2 border theme-border" style={{borderWidth: '1px'}}>
                    <div className="theme-text-secondary">Followers</div>
                    <div className="theme-text-primary font-bold">{farcasterUser.followerCount}</div>
                  </div>
                  <div className="theme-card-bg rounded p-2 border theme-border" style={{borderWidth: '1px'}}>
                    <div className="theme-text-secondary">Following</div>
                    <div className="theme-text-primary font-bold">{farcasterUser.followingCount}</div>
                  </div>
                </div>
                {/* Token stats moved next to profile */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                    <div className="theme-text-secondary">Rank</div>
                    <div className="theme-text-primary font-bold">#3</div>
                  </div>
                  <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                    <div className="theme-text-secondary">Flow Rate</div>
                    <div className="theme-text-primary font-bold">{isWalletConnected ? flowRate : "0.000 ETH/day"}</div>
                  </div>
                  <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                    <div className="theme-text-secondary">Total Streamed</div>
                    <div className="theme-text-primary font-bold">{isWalletConnected ? totalVolumeStreamed : "0.000 ETH"}</div>
                  </div>
                </div>
                <Button onClick={farcasterSignOut} variant="outline" className="w-full theme-border theme-text-primary hover:theme-button hover:text-black bg-transparent" style={{borderWidth: '1px'}}>
                  DISCONNECT
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* If wallet connected, show WHOIS + chain stats */}
                {isWalletConnected && address ? (
                  <div className="space-y-3">
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
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                        <div className="theme-text-secondary">Rank (Flow)</div>
                        <div className="theme-text-primary font-bold">{userStatsLoading ? "…" : (chainStats?.flowRank ?? "—")}</div>
                      </div>
                      <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                        <div className="theme-text-secondary">Flow/day</div>
                        <div className="theme-text-primary font-bold">{userStatsLoading ? "…" : (chainStats?.currentFlowPerDayUSDCx ? `${chainStats.currentFlowPerDayUSDCx} ${TOKEN_SYMBOL}` : `0 ${TOKEN_SYMBOL}`)}</div>
                      </div>
                      <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                        <div className="theme-text-secondary">Total Streamed</div>
                        <div className="theme-text-primary font-bold">{userStatsLoading ? "…" : (chainStats?.totalStreamedUSDCx ? `${chainStats.totalStreamedUSDCx} ${TOKEN_SYMBOL}` : `0 ${TOKEN_SYMBOL}`)}</div>
                      </div>
                      <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                        <div className="theme-text-secondary">Rank (Volume)</div>
                        <div className="theme-text-primary font-bold">{userStatsLoading ? "…" : (chainStats?.volumeRank ?? "—")}</div>
                      </div>
                      <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                        <div className="theme-text-secondary">Stream Since</div>
                        <div className="theme-text-primary font-bold">{chainStats?.activeStreamSince ? new Date(chainStats.activeStreamSince * 1000).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span className="text-red-400">DISCONNECTED</span>
                    </div>
                    <Button onClick={farcasterSignIn} disabled={isFarcasterConnecting} className="w-full theme-button text-black font-bold">
                      {isFarcasterConnecting ? "CONNECTING..." : "CONNECT FARCASTER"}
                    </Button>
                    <div className="w-full">
                      <appkit-button />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
            <h2 className="text-xl font-bold mb-4 theme-text-primary">TOKEN STATS</h2>
            {tokenStats && (
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="theme-text-secondary">Active Streams (CFA)</div>
                  <div className="theme-text-primary font-bold">{tokenStats.activeCFAStreams}</div>
                </div>
                <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="theme-text-secondary">Total Outflow/day</div>
                  <div className="theme-text-primary font-bold">{tokenStats.totalOutflowPerDay} {TOKEN_SYMBOL}</div>
                </div>
                <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                  <div className="theme-text-secondary">Total Streamed</div>
                  <div className="theme-text-primary font-bold">{tokenStats.totalStreamed} {TOKEN_SYMBOL}</div>
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

          <EventsCard className="lg:col-span-1" />
          
          <div className="theme-card-bg theme-border rounded-lg p-6 lg:col-span-3" style={{borderWidth: '1px'}}>
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
                      <div className="theme-text-primary font-bold">{entry.value}</div>
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

          <TokenChart className="lg:col-span-2" />
          
          <StremeCard className="lg:col-span-1" />
        </div>
      </div>
    </div>
  );
}

export default function MainApp() {
  return (
    <FarcasterProvider>
      <WalletProvider>
        <MainView />
      </WalletProvider>
    </FarcasterProvider>
  );
}


