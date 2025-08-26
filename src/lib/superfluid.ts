import { formatUnits } from "viem";

export const SUPERFLUID_SUBGRAPH_BASE =
  "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1";

// Token configuration from environment variables
export const TOKEN_ADDRESS = (import.meta.env.VITE_TOKEN_ADDRESS as string) ?? "0x1c4f69f14cf754333c302246d25a48a13224118a";
export const TOKEN_SYMBOL = (import.meta.env.VITE_TOKEN_SYMBOL as string) ?? "BUTTHOLE";

// Social links configuration from environment variables
export const SOCIAL_LINKS = {
  twitter: (import.meta.env.VITE_X_URL as string) ?? "",
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
  totalGDANumberOfActiveStreams: number;
  totalNumberOfPools: number;
  totalNumberOfIndexes: number;
  totalNumberOfHolders: number;
  totalNumberOfAccounts: number;
  totalOutflowRate: string; // per-second, raw
  totalCFAOutflowRate: string; // per-second, raw
  totalGDAOutflowRate: string; // per-second, raw
  totalAmountStreamedUntilUpdatedAt: string; // token units raw
  totalSupply: string; // token units raw
}

export async function fetchTokenStatistics(tokenAddress: string): Promise<TokenStatistics | null> {
  const query = `
    query TokenStats($id: ID!) {
      tokenStatistic(id: $id) {
        totalNumberOfActiveStreams
        totalCFANumberOfActiveStreams
        totalGDANumberOfActiveStreams
        totalNumberOfPools
        totalNumberOfIndexes
        totalNumberOfHolders
        totalNumberOfAccounts
        totalOutflowRate
        totalCFAOutflowRate
        totalGDAOutflowRate
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

// Streme API integration
export interface StremeTokenData {
  id?: number;
  block_number?: number;
  tx_hash?: string;
  contract_address?: string;
  name?: string;
  symbol?: string;
  type?: string;
  pair?: string;
  presale_id?: string | null;
  chain_id?: number;
  metadata?: any;
  tokenFactory?: string;
  postDeployHook?: string;
  liquidityFactory?: string;
  postLpHook?: string;
  poolConfig?: {
    tick?: number;
    pairedToken?: string;
    devBuyFee?: number;
  };
  staking_pool?: string;
  staking_address?: string;
  pool_address?: string;
  img_url?: string;
  requestor_fid?: number;
  deployer?: string;
  cast_hash?: string;
  username?: string;
  pfp_url?: string;
  lastTraded?: {
    _seconds?: number;
    _nanoseconds?: number;
  };
  marketData?: {
    marketCap?: number;
    price?: number;
    priceChange1h?: number;
    priceChange24h?: number;
    priceChange5m?: number;
    volume24h?: number;
    lastUpdated?: {
      _seconds?: number;
      _nanoseconds?: number;
    };
  };
  created_at?: string;
  creator?: {
    name?: string;
    score?: number;
    recasts?: number;
    likes?: number;
    profileImage?: string;
  };
  price?: number;
  marketCap?: number;
  volume24h?: number;
  change1h?: number;
  change24h?: number;
}

export async function fetchStremeTokenData(tokenAddress: string): Promise<StremeTokenData | null> {
  try {
    const response = await fetch(`/api/streme/tokens/single?address=${tokenAddress.toLowerCase()}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    // The response might be wrapped in a 'data' property
    const data = result.data || result;
    return data as StremeTokenData;
  } catch (error) {
    console.error('Error fetching Streme token data:', error);
    return null;
  }
}

export interface PoolMember {
  account: string;
  units: string;
  totalAmountReceivedUntilUpdatedAt: string;
}

export async function fetchTopPoolMembers(
  poolAddress: string,
  first = 10,
  skip = 0,
): Promise<PoolMember[]> {
  const query = `
    query TopPoolMembers($pool: String!, $first: Int!, $skip: Int!) {
      poolMembers(
        where: { pool: $pool, units_gt: 0 }
        orderBy: units
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        account { id }
        units
        totalAmountReceivedUntilUpdatedAt
      }
    }
  `;

  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { pool: poolAddress.toLowerCase(), first, skip } }),
  });

  const json = (await res.json()) as GraphQlResponse<{
    poolMembers: Array<{
      account: { id: string };
      units: string;
      totalAmountReceivedUntilUpdatedAt: string;
    }>;
  }>;

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return (json.data?.poolMembers ?? []).map((m) => ({
    account: m.account.id,
    units: m.units,
    totalAmountReceivedUntilUpdatedAt: m.totalAmountReceivedUntilUpdatedAt,
  }));
}

export interface UniswapPoolData {
  id: string;
  address: string;
  feeTier: number;
  token0: {
    id: string;
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    market?: {
      price?: {
        value: number;
      };
    };
  };
  token0Supply: string;
  token1: {
    id: string;
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    market?: {
      price?: {
        value: number;
      };
    };
  };
  token1Supply: string;
  txCount: number;
  volume24h?: {
    value: number;
  };
  totalLiquidity?: {
    value: number;
  };
  totalLiquidityPercentChange24h?: {
    value: number;
  };
}

export async function fetchUniswapPoolData(poolAddress: string): Promise<UniswapPoolData | null> {
  try {
    const query = `
      query V3Pool($chain: Chain!, $address: String!) {
        v3Pool(chain: $chain, address: $address) {
          id
          protocolVersion
          address
          feeTier
          token0 {
            id
            address
            chain
            decimals
            name
            standard
            symbol
            market(currency: USD) {
              id
              price {
                id
                value
              }
            }
          }
          token0Supply
          token1 {
            id
            address
            chain
            decimals
            name
            standard
            symbol
            market(currency: USD) {
              id
              price {
                id
                value
              }
            }
          }
          token1Supply
          txCount
          volume24h: cumulativeVolume(duration: DAY) {
            value
          }
          totalLiquidity {
            value
          }
          totalLiquidityPercentChange24h {
            value
          }
        }
      }
    `;

    const response = await fetch('/api/uniswap/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'V3Pool',
        variables: {
          chain: 'BASE',
          address: poolAddress,
        },
        query,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('Uniswap GraphQL errors:', result.errors);
      return null;
    }

    return result.data?.v3Pool || null;
  } catch (error) {
    console.error('Error fetching Uniswap pool data:', error);
    return null;
  }
}

// Token Events Interface
export interface TokenEvent {
  id: string;
  blockNumber: string;
  timestamp: string;
  transactionHash: string;
  name: string;
  addresses: string[];
  token: string;
  userData?: string;
}

export async function fetchTokenEvents(tokenAddress: string, first = 10): Promise<TokenEvent[]> {
  const query = `
    query TokenEvents($token: String!, $first: Int!) {
      events(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        name
        addresses
        token
        userData
      }
    }
  `;

  try {
    const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        query, 
        variables: { 
          token: tokenAddress.toLowerCase(),
          first 
        } 
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return [];
    }

    return result.data?.events || [];
  } catch (error) {
    console.error("Error fetching token events:", error);
    return [];
  }
}


