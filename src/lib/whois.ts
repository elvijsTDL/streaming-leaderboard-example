import { getAddress } from "viem";

export interface ResolvedProfileServiceInfo {
  handle?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
}

export interface ResolvedProfile {
  address: string;
  recommendedName?: string | null;
  recommendedAvatar?: string | null;
  recommendedService?: string | null;
  ENS?: ResolvedProfileServiceInfo;
  Farcaster?: ResolvedProfileServiceInfo;
}

const WHOIS_BASE = import.meta.env.DEV
  ? "/api/whois"
  : "https://whois.superfluid.finance/api";

export async function resolveAddressProfile(address: string): Promise<ResolvedProfile> {
  let checksummed = address;
  try {
    checksummed = getAddress(address);
  } catch {
    // keep as-is
  }
  const url = `${WHOIS_BASE}/resolve/${checksummed}`;
  const res = await fetch(url, { headers: { "content-type": "application/json" } });
  if (!res.ok) {
    return { address: checksummed };
  }
  const json = (await res.json()) as any;
  return {
    address: checksummed,
    recommendedName: json?.recommendedName ?? null,
    recommendedAvatar: json?.recommendedAvatar ?? null,
    recommendedService: json?.recommendedService ?? null,
    ENS: json?.ENS ?? undefined,
    Farcaster: json?.Farcaster ?? undefined,
  };
}

export async function resolveManyProfiles(addresses: string[]): Promise<Record<string, ResolvedProfile>> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())));
  const results = await Promise.all(
    unique.map(async (addr) => {
      try {
        const profile = await resolveAddressProfile(addr);
        return [addr, profile] as const;
      } catch {
        return [addr, { address: addr } as ResolvedProfile] as const;
      }
    }),
  );
  return Object.fromEntries(results);
}


