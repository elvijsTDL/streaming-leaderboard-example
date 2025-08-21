"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { FarcasterProvider, useFarcaster } from "../hooks/use-farcaster";
import { useUserProfile } from "../hooks/use-user-profile";
import { WalletProvider, useWallet } from "../hooks/use-wallet";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, fetchTopFlowRateLeaders, fetchTopVolumeLeaders, formatFlowRatePerDay, formatTokenAmount, fetchTokenStatistics } from "../lib/superfluid";
import { resolveManyProfiles, type ResolvedProfile } from "../lib/whois";
import { TokenChart } from "./token-chart";

function MainView() {
  const { user: farcasterUser, isConnected: isFarcasterConnected, signIn: farcasterSignIn, signOut: farcasterSignOut, isConnecting: isFarcasterConnecting } = useFarcaster();
  const { address, isConnected: isWalletConnected, flowRate, totalVolumeStreamed } = useWallet();
  const { profile: whoisProfile, chainStats, loading: userStatsLoading } = useUserProfile();

  const isFullyConnected = isFarcasterConnected && isWalletConnected;

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
    <div className="min-h-screen bg-black text-amber-400 font-mono">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">FARCASTER TOKEN MATRIX</h1>
          <p className="text-amber-500">{isFullyConnected ? "Fully connected to the decentralized protocol" : "Connect Farcaster and wallet to access all features"}</p>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isFarcasterConnected ? "bg-amber-400" : "bg-red-400"}`}></div>
              <span className="text-xs">Farcaster</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isWalletConnected ? "bg-amber-400" : "bg-red-400"}`}></div>
              <span className="text-xs">Wallet</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-900 border border-amber-600 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-amber-400">USER PROFILE</h2>
            {isFarcasterConnected && farcasterUser ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img src={farcasterUser.pfpUrl || "/placeholder.svg"} alt="Profile" className="w-10 h-10 rounded-full border border-amber-600" />
                  <div>
                    <div className="text-amber-400 font-bold">@{farcasterUser.username}</div>
                    <div className="text-amber-500 text-sm">{farcasterUser.displayName}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/50 rounded p-2 border border-amber-600/30">
                    <div className="text-amber-500">Followers</div>
                    <div className="text-amber-400 font-bold">{farcasterUser.followerCount}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2 border border-amber-600/30">
                    <div className="text-amber-500">Following</div>
                    <div className="text-amber-400 font-bold">{farcasterUser.followingCount}</div>
                  </div>
                </div>
                {/* Token stats moved next to profile */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                    <div className="text-amber-500">Rank</div>
                    <div className="text-amber-400 font-bold">#3</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                    <div className="text-amber-500">Flow Rate</div>
                    <div className="text-amber-400 font-bold">{isWalletConnected ? flowRate : "0.000 ETH/day"}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                    <div className="text-amber-500">Total Streamed</div>
                    <div className="text-amber-400 font-bold">{isWalletConnected ? totalVolumeStreamed : "0.000 ETH"}</div>
                  </div>
                </div>
                <Button onClick={farcasterSignOut} variant="outline" className="w-full border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black bg-transparent">
                  DISCONNECT
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* If wallet connected, show WHOIS + chain stats */}
                {isWalletConnected && address ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <img src={whoisProfile?.recommendedAvatar || whoisProfile?.Farcaster?.avatarUrl || whoisProfile?.ENS?.avatarUrl || "/placeholder.svg"} alt="Profile" className="w-10 h-10 rounded-full border border-amber-600" />
                      <div>
                        <div className="text-amber-400 font-bold">{whoisProfile?.recommendedName || whoisProfile?.ENS?.handle || whoisProfile?.Farcaster?.handle || `${address.slice(0,6)}...${address.slice(-4)}`}</div>
                        <div className="text-amber-500 text-xs break-all">{address}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(address)}
                        className="text-xs px-2 py-0.5 rounded border border-amber-600/40 text-amber-400 hover:bg-amber-600 hover:text-black"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                        <div className="text-amber-500">Rank (Flow)</div>
                        <div className="text-amber-400 font-bold">{userStatsLoading ? "…" : (chainStats?.flowRank ?? "—")}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                        <div className="text-amber-500">Flow/day</div>
                        <div className="text-amber-400 font-bold">{userStatsLoading ? "…" : (chainStats?.currentFlowPerDayUSDCx ? `${chainStats.currentFlowPerDayUSDCx} ${TOKEN_SYMBOL}` : `0 ${TOKEN_SYMBOL}`)}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                        <div className="text-amber-500">Total Streamed</div>
                        <div className="text-amber-400 font-bold">{userStatsLoading ? "…" : (chainStats?.totalStreamedUSDCx ? `${chainStats.totalStreamedUSDCx} ${TOKEN_SYMBOL}` : `0 ${TOKEN_SYMBOL}`)}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                        <div className="text-amber-500">Rank (Volume)</div>
                        <div className="text-amber-400 font-bold">{userStatsLoading ? "…" : (chainStats?.volumeRank ?? "—")}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                        <div className="text-amber-500">Stream Since</div>
                        <div className="text-amber-400 font-bold">{chainStats?.activeStreamSince ? new Date(chainStats.activeStreamSince * 1000).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span className="text-red-400">DISCONNECTED</span>
                    </div>
                    <Button onClick={farcasterSignIn} disabled={isFarcasterConnecting} className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold">
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

          <div className="bg-gray-900 border border-amber-600 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-amber-400">TOKEN STATS</h2>
            {tokenStats && (
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Active Streams (CFA)</div>
                  <div className="text-amber-400 font-bold">{tokenStats.activeCFAStreams}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Total Outflow/day</div>
                  <div className="text-amber-400 font-bold">{tokenStats.totalOutflowPerDay} {TOKEN_SYMBOL}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Total Streamed</div>
                  <div className="text-amber-400 font-bold">{tokenStats.totalStreamed} {TOKEN_SYMBOL}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Total Supply</div>
                  <div className="text-amber-400 font-bold">{tokenStats.totalSupply} {TOKEN_SYMBOL}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Pools / Indexes</div>
                  <div className="text-amber-400 font-bold">{tokenStats.totalPools} / {tokenStats.totalIndexes}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 border border-amber-600/30">
                  <div className="text-amber-500">Holders / Accounts</div>
                  <div className="text-amber-400 font-bold">{tokenStats.holders} / {tokenStats.accounts}</div>
                </div>
              </div>
            )}
            
          </div>

          <div className="bg-gray-900 border border-amber-600 rounded-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-400">TOKEN LEADERBOARD ({TOKEN_SYMBOL})</h2>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  className={`px-3 py-1 rounded border ${activeLeaderboardTab === "flow" ? "bg-amber-600 text-black border-amber-600" : "bg-transparent text-amber-400 border-amber-600/40"}`}
                  onClick={() => setActiveLeaderboardTab("flow")}
                >
                  Flow Rate
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded border ${activeLeaderboardTab === "volume" ? "bg-amber-600 text-black border-amber-600" : "bg-transparent text-amber-400 border-amber-600/40"}`}
                  onClick={() => setActiveLeaderboardTab("volume")}
                >
                  Volume
                </button>
              </div>
            </div>

            {isLoadingLeaders ? (
              <div className="text-amber-600 text-center py-8">Loading leaderboard…</div>
            ) : displayEntries.length > 0 ? (
              <div className="space-y-3">
                {displayEntries.map((entry) => {
                  const p = profiles[entry.address.toLowerCase()];
                  const name = p?.recommendedName || p?.ENS?.handle || p?.Farcaster?.handle || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;
                  const avatar = p?.recommendedAvatar || p?.Farcaster?.avatarUrl || p?.ENS?.avatarUrl || "/placeholder.svg";
                  return (
                  <div key={`${activeLeaderboardTab}-${entry.rank}-${entry.address}`} className={`flex items-center justify-between p-3 rounded ${entry.isYou ? "bg-amber-500/10 border border-amber-500/30" : "bg-gray-800/50"}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">#{entry.rank}</div>
                      <img src={avatar} alt="avatar" className="w-6 h-6 rounded-full border border-amber-600" />
                      <span className="text-amber-400 break-all">{name}</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(entry.address)}
                        className="text-xs px-2 py-0.5 rounded border border-amber-600/40 text-amber-400 hover:bg-amber-600 hover:text-black"
                        title="Copy address"
                      >
                        Copy
                      </button>
                      {entry.isYou && <span className="text-xs bg-amber-500 text-black px-2 py-1 rounded font-bold">YOU</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-bold">{entry.value}</div>
                      <div className="text-amber-600 text-xs">{activeLeaderboardTab === "flow" ? "per day" : "total streamed"}</div>
                    </div>
                  </div>
                  );
                })}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={`px-3 py-1 rounded border ${page === 0 ? "border-amber-600/20 text-amber-600/40" : "border-amber-600/60 text-amber-400 hover:bg-amber-600 hover:text-black"}`}
                  >
                    Prev
                  </button>
                  <div className="text-xs text-amber-500">Page {page + 1}</div>
                  <button
                    type="button"
                    disabled={activeLeaderboardTab === "flow" ? !hasNextFlow : !hasNextVolume}
                    onClick={() => setPage((p) => p + 1)}
                    className={`px-3 py-1 rounded border ${(activeLeaderboardTab === "flow" ? !hasNextFlow : !hasNextVolume) ? "border-amber-600/20 text-amber-600/40" : "border-amber-600/60 text-amber-400 hover:bg-amber-600 hover:text-black"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-amber-600 text-center py-8">No data</div>
            )}
          </div>

          <TokenChart className="lg:col-span-2" />
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


