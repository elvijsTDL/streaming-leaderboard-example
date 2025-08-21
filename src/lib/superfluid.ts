import { formatUnits } from "viem";

export const SUPERFLUID_SUBGRAPH_BASE =
  "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1";

// Token configuration from environment variables
export const TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS as string) ?? "0x1c4f69f14cf754333c302246d25a48a13224118a";
export const TOKEN_SYMBOL = (import.meta.env.VITE_TOKEN_SYMBOL as string) ?? "BUTTHOLE";

// Social links configuration from environment variables
export const SOCIAL_LINKS = {
  twitter: (import.meta.env.VITE_TWITTER_URL as string) ?? "",
  farcaster: (import.meta.env.VITE_FARCASTER_URL as string) ?? "",
  telegram: (import.meta.env.VITE_TELEGRAM_URL as string) ?? "",
  website: (import.meta.env.VITE_WEBSITE_URL as string) ?? "",
};

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export interface LeaderboardEntry {
  account: string;
  value: string; // raw BigInt string (per-second for flow; token units for volume)
}

export interface TokenStatistics {
  totalNumberOfActiveStreams: number;
  totalCFANumberOfActiveStreams: number;
  totalNumberOfPools: number;
  totalNumberOfIndexes: number;
  totalNumberOfHolders: number;
  totalNumberOfAccounts: number;
  totalOutflowRate: string; // per-second, raw
  totalCFAOutflowRate: string; // per-second, raw
  totalAmountStreamedUntilUpdatedAt: string; // token units raw
  totalSupply: string; // token units raw
}

export async function fetchTokenStatistics(tokenAddress: string): Promise<TokenStatistics | null> {
  const query = `
    query TokenStats($id: ID!) {
      tokenStatistic(id: $id) {
        totalNumberOfActiveStreams
        totalCFANumberOfActiveStreams
        totalNumberOfPools
        totalNumberOfIndexes
        totalNumberOfHolders
        totalNumberOfAccounts
        totalOutflowRate
        totalCFAOutflowRate
        totalAmountStreamedUntilUpdatedAt
        totalSupply
      }
    }
  `;

  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { id: tokenAddress.toLowerCase() } }),
  });

  const json = (await res.json()) as GraphQlResponse<{
    tokenStatistic: null | {
      totalNumberOfActiveStreams: number;
      totalCFANumberOfActiveStreams: number;
      totalNumberOfPools: number;
      totalNumberOfIndexes: number;
      totalNumberOfHolders: number;
      totalNumberOfAccounts: number;
      totalOutflowRate: string;
      totalCFAOutflowRate: string;
      totalAmountStreamedUntilUpdatedAt: string;
      totalSupply: string;
    };
  }>;

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return json.data?.tokenStatistic
    ? {
        totalNumberOfActiveStreams: json.data.tokenStatistic.totalNumberOfActiveStreams,
        totalCFANumberOfActiveStreams: json.data.tokenStatistic.totalCFANumberOfActiveStreams,
        totalNumberOfPools: json.data.tokenStatistic.totalNumberOfPools,
        totalNumberOfIndexes: json.data.tokenStatistic.totalNumberOfIndexes,
        totalNumberOfHolders: json.data.tokenStatistic.totalNumberOfHolders,
        totalNumberOfAccounts: json.data.tokenStatistic.totalNumberOfAccounts,
        totalOutflowRate: json.data.tokenStatistic.totalOutflowRate,
        totalCFAOutflowRate: json.data.tokenStatistic.totalCFAOutflowRate,
        totalAmountStreamedUntilUpdatedAt: json.data.tokenStatistic.totalAmountStreamedUntilUpdatedAt,
        totalSupply: json.data.tokenStatistic.totalSupply,
      }
    : null;
}

export async function fetchTopFlowRateLeaders(
  tokenAddress: string,
  first = 10,
  skip = 0,
): Promise<LeaderboardEntry[]> {
  const query = `
    query TopFlowRate($token: String!, $first: Int!, $skip: Int!) {
      accountTokenSnapshots(
        where: { token: $token, totalCFAOutflowRate_gt: 0 }
        orderBy: totalCFAOutflowRate
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        account { id }
        totalCFAOutflowRate
      }
    }
  `;

  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { token: tokenAddress.toLowerCase(), first, skip } }),
  });

  const json = (await res.json()) as GraphQlResponse<{
    accountTokenSnapshots: Array<{
      account: { id: string };
      totalCFAOutflowRate: string;
    }>;
  }>;

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return (json.data?.accountTokenSnapshots ?? []).map((s) => ({
    account: s.account.id,
    value: s.totalCFAOutflowRate,
  }));
}

export async function fetchTopVolumeLeaders(
  tokenAddress: string,
  first = 10,
  skip = 0,
): Promise<LeaderboardEntry[]> {
  const query = `
    query TopVolume($token: String!, $first: Int!, $skip: Int!) {
      accountTokenSnapshots(
        where: { token: $token, totalCFAAmountStreamedOutUntilUpdatedAt_gt: 0 }
        orderBy: totalCFAAmountStreamedOutUntilUpdatedAt
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        account { id }
        totalCFAAmountStreamedOutUntilUpdatedAt
      }
    }
  `;

  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { token: tokenAddress.toLowerCase(), first, skip } }),
  });

  const json = (await res.json()) as GraphQlResponse<{
    accountTokenSnapshots: Array<{
      account: { id: string };
      totalCFAAmountStreamedOutUntilUpdatedAt: string;
    }>;
  }>;

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return (json.data?.accountTokenSnapshots ?? []).map((s) => ({
    account: s.account.id,
    value: s.totalCFAAmountStreamedOutUntilUpdatedAt,
  }));
}

export function formatTokenAmount(raw: string, fractionDigits = 4): string {
  // Most Superfluid tokens have 18 decimals
  const formatted = formatUnits(BigInt(raw), 18);
  const num = Number(formatted);
  if (!Number.isFinite(num)) return formatted;
  return num.toFixed(fractionDigits);
}

export function formatFlowRatePerDay(rawPerSecond: string, fractionDigits = 6): string {
  const perSecond = Number(formatUnits(BigInt(rawPerSecond), 18));
  if (!Number.isFinite(perSecond)) return formatUnits(BigInt(rawPerSecond), 18);
  const perDay = perSecond * 86400;
  return perDay.toFixed(fractionDigits);
}


