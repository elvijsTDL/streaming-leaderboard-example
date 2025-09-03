"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { resolveAddressProfile, type ResolvedProfile } from "../lib/whois";
import {
  TOKEN_ADDRESS,
  fetchTopFlowRateLeaders,
  fetchTopVolumeLeaders,
  formatFlowRatePerDay,
  formatTokenAmount,
} from "../lib/superfluid";

interface UserChainStats {
  address: string;
  profile?: ResolvedProfile;
  totalStreamedToken?: string; 
  currentFlowPerDayToken?: string; 
  flowRank?: number | null; 
  volumeRank?: number | null;
  activeStreamSince?: number | null;
}

export function useUserProfile() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<ResolvedProfile | undefined>(undefined);
  const [chainStats, setChainStats] = useState<UserChainStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to compute ranks by scanning pages
  async function computeRanks(addr: string) {
    const PAGE = 100;
    const MAX_PAGES = 20; // up to 2,000 entries

    let flowRank: number | null = null;
    let volumeRank: number | null = null;

    for (let p = 0; p < MAX_PAGES && flowRank === null; p++) {
      const entries = await fetchTopFlowRateLeaders(TOKEN_ADDRESS, PAGE, p * PAGE);
      const idx = entries.findIndex((e) => e.account.toLowerCase() === addr.toLowerCase());
      if (idx >= 0) flowRank = p * PAGE + idx + 1;
      if (entries.length < PAGE) break;
    }

    for (let p = 0; p < MAX_PAGES && volumeRank === null; p++) {
      const entries = await fetchTopVolumeLeaders(TOKEN_ADDRESS, PAGE, p * PAGE);
      const idx = entries.findIndex((e) => e.account.toLowerCase() === addr.toLowerCase());
      if (idx >= 0) volumeRank = p * PAGE + idx + 1;
      if (entries.length < PAGE) break;
    }

    return { flowRank, volumeRank };
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isConnected || !address) {
        setProfile(undefined);
        setChainStats(null);
        return;
      }
      setLoading(true);
      try {
        // Resolve human-friendly name/avatar
        const resolved = await resolveAddressProfile(address);

        // Query the user's snapshot for token using subgraph directly
        // We reuse the token leaderboard helpers to derive ranks, and compute values from those entries
        // Warm up subgraph (no-op result usage to avoid first-call latency)
        await Promise.all([
          fetchTopFlowRateLeaders(TOKEN_ADDRESS, 1, 0),
          fetchTopVolumeLeaders(TOKEN_ADDRESS, 1, 0),
        ]);

        // Compute ranks across pages
        const { flowRank, volumeRank } = await computeRanks(address);

        // For the actual user's values, fetch a single page including the user by scanning pages until found
        let currentFlowPerDayToken: string | undefined;
        let totalStreamedToken: string | undefined;
        const PAGE = 100;
        const MAX_PAGES = 20;
        for (let p = 0; p < MAX_PAGES && (currentFlowPerDayToken === undefined || totalStreamedToken === undefined); p++) {
          const [flowPage, volumePage] = await Promise.all([
            fetchTopFlowRateLeaders(TOKEN_ADDRESS, PAGE, p * PAGE),
            fetchTopVolumeLeaders(TOKEN_ADDRESS, PAGE, p * PAGE),
          ]);
          if (currentFlowPerDayToken === undefined) {
            const f = flowPage.find((e) => e.account.toLowerCase() === address.toLowerCase());
            if (f) currentFlowPerDayToken = formatFlowRatePerDay(f.value);
          }
          if (totalStreamedToken === undefined) {
            const v = volumePage.find((e) => e.account.toLowerCase() === address.toLowerCase());
            if (v) totalStreamedToken = formatTokenAmount(v.value);
          }
          if (flowPage.length < PAGE && volumePage.length < PAGE) break;
        }

        if (!cancelled) {
          setProfile(resolved);
          setChainStats({
            address,
            profile: resolved,
            currentFlowPerDayToken,
            totalStreamedToken,
            flowRank: flowRank ?? null,
            volumeRank: volumeRank ?? null,
            activeStreamSince: null, // Optional: StreamPeriod scan could be added here
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  return useMemo(
    () => ({ address, isConnected, profile, chainStats, loading }),
    [address, isConnected, profile, chainStats, loading],
  );
}


