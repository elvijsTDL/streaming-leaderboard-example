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

// Debug function to test all API endpoints
export async function debugAllEndpoints(tokenAddress: string = TOKEN_ADDRESS) {
  console.log('🔍 Starting API endpoint debugging...');
  console.log('🪙 Token address:', tokenAddress);
  console.log('🌐 Environment:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    BASE_URL: import.meta.env.BASE_URL,
    MODE: import.meta.env.MODE
  });
  
  // Test Superfluid subgraph
  console.log('\n🟣 Testing Superfluid subgraph...');
  try {
    const tokenStats = await fetchTokenStatistics(tokenAddress);
    console.log('✅ Superfluid subgraph working:', !!tokenStats);
  } catch (error) {
    console.error('❌ Superfluid subgraph failed:', error);
  }
  
  // Test Streme API
  console.log('\n🎯 Testing Streme API...');
  try {
    const stremeData = await fetchStremeTokenData(tokenAddress);
    console.log('✅ Streme API working:', !!stremeData);
  } catch (error) {
    console.error('❌ Streme API failed:', error);
  }
  
  // Test local API routes
  console.log('\n🔧 Testing local API routes...');
  const testRoutes = [
    '/api/streme/tokens/single',
    '/api/uniswap/graphql'
  ];
  
  for (const route of testRoutes) {
    try {
      const response = await fetch(route, { method: 'GET' });
      console.log(`📍 ${route}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`❌ ${route}: ${error}`);
    }
  }
  
  console.log('\n🏁 API debugging complete');
}

// Call this function automatically in development
if (import.meta.env.DEV) {
  // Delay the debug call to avoid blocking app initialization
  setTimeout(() => {
    debugAllEndpoints().catch(console.error);
  }, 3000);
}

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export interface LeaderboardEntry {
  account: string;
  value: string; // raw BigInt string (per-second for flow; token units for volume)
}

export interface VolumeLeaderboardEntry {
  account: string;
  totalAmountStreamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  totalOutflowRate: string;
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
  updatedAtTimestamp: string; // timestamp when stats were last updated
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
        updatedAtTimestamp
      }
    }
  `;

  console.log('🟣 Superfluid: Fetching token statistics for:', tokenAddress);
  console.log('🌐 Superfluid endpoint:', SUPERFLUID_SUBGRAPH_BASE);
  
  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { id: tokenAddress.toLowerCase() } }),
  });

  console.log('🟣 Superfluid response status:', res.status, res.statusText);
  
  if (!res.ok) {
    console.error(`❌ Superfluid subgraph error: ${res.status} ${res.statusText}`);
    console.error('📍 URL:', res.url);
    
    try {
      const errorText = await res.text();
      console.error('💥 Superfluid error response:', errorText);
    } catch (e) {
      console.error('💥 Could not read Superfluid error response');
    }
    
    throw new Error(`Superfluid API error: ${res.status}`);
  }

  const json = (await res.json()) as GraphQlResponse<{
    tokenStatistic: null | {
      totalNumberOfActiveStreams: number;
      totalCFANumberOfActiveStreams: number;
      totalGDANumberOfActiveStreams: number;
      totalNumberOfPools: number;
      totalNumberOfIndexes: number;
      totalNumberOfHolders: number;
      totalNumberOfAccounts: number;
      totalOutflowRate: string;
      totalCFAOutflowRate: string;
      totalGDAOutflowRate: string;
      totalAmountStreamedUntilUpdatedAt: string;
      totalSupply: string;
      updatedAtTimestamp: string;
    };
  }>;

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return json.data?.tokenStatistic
    ? {
        totalNumberOfActiveStreams: json.data.tokenStatistic.totalNumberOfActiveStreams,
        totalCFANumberOfActiveStreams: json.data.tokenStatistic.totalCFANumberOfActiveStreams,
        totalGDANumberOfActiveStreams: json.data.tokenStatistic.totalGDANumberOfActiveStreams,
        totalNumberOfPools: json.data.tokenStatistic.totalNumberOfPools,
        totalNumberOfIndexes: json.data.tokenStatistic.totalNumberOfIndexes,
        totalNumberOfHolders: json.data.tokenStatistic.totalNumberOfHolders,
        totalNumberOfAccounts: json.data.tokenStatistic.totalNumberOfAccounts,
        totalOutflowRate: json.data.tokenStatistic.totalOutflowRate,
        totalCFAOutflowRate: json.data.tokenStatistic.totalCFAOutflowRate,
        totalGDAOutflowRate: json.data.tokenStatistic.totalGDAOutflowRate,
        totalAmountStreamedUntilUpdatedAt: json.data.tokenStatistic.totalAmountStreamedUntilUpdatedAt,
        totalSupply: json.data.tokenStatistic.totalSupply,
        updatedAtTimestamp: json.data.tokenStatistic.updatedAtTimestamp,
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

export async function fetchTopVolumeLeadersWithStreaming(
  tokenAddress: string,
  first = 10,
  skip = 0,
): Promise<VolumeLeaderboardEntry[]> {
  const query = `
    query TopVolumeStreaming($token: String!, $first: Int!, $skip: Int!) {
      accountTokenSnapshots(
        where: { token: $token, totalCFAAmountStreamedOutUntilUpdatedAt_gt: 0 }
        orderBy: totalCFAAmountStreamedOutUntilUpdatedAt
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        account { id }
        totalCFAAmountStreamedOutUntilUpdatedAt
        updatedAtTimestamp
        totalCFAOutflowRate
      }
    }
  `;

  const res = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { token: tokenAddress.toLowerCase(), first, skip } }),
  });

  const json: GraphQlResponse<{ accountTokenSnapshots: { account: { id: string }; totalCFAAmountStreamedOutUntilUpdatedAt: string; updatedAtTimestamp: string; totalCFAOutflowRate: string; }[] }> = await res.json();

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return (json.data?.accountTokenSnapshots ?? []).map((s) => ({
    account: s.account.id,
    totalAmountStreamedUntilUpdatedAt: s.totalCFAAmountStreamedOutUntilUpdatedAt,
    updatedAtTimestamp: s.updatedAtTimestamp,
    totalOutflowRate: s.totalCFAOutflowRate,
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
        updatedAtTimestamp
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
    console.log('🎯 Attempting to fetch Streme data for token:', tokenAddress);
    
    // Try direct API call first (if available)
    const directUrl = `https://api.streme.fun/tokens/single?address=${tokenAddress.toLowerCase()}`;
    console.log('🌐 Direct API URL:', directUrl);
    
    let response = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    // If direct call fails, try through local API proxy
    if (!response.ok) {
      console.log('❌ Direct API failed, trying local proxy...');
      const proxyUrl = `/api/streme/tokens/single?address=${tokenAddress.toLowerCase()}`;
      console.log('🔄 Proxy URL:', proxyUrl);
      
      response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
    }

    if (!response.ok) {
      console.error(`❌ Streme API error: ${response.status} ${response.statusText}`);
      console.error('📍 URL:', response.url);
      return null;
    }

    const result = await response.json();
    console.log('✅ Streme API response:', result);
    
    // The response might be wrapped in a 'data' property
    const data = result.data || result;
    return data as StremeTokenData;
  } catch (error) {
    console.error('💥 Error fetching Streme token data:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
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
    console.log('🏊 Attempting to fetch Uniswap pool data for:', poolAddress);
    
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

    const apiUrl = '/api/uniswap/graphql';
    console.log('📊 Uniswap API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
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

    console.log('📊 Uniswap response status:', response.status, response.statusText);
    console.log('📍 Uniswap response URL:', response.url);

    if (!response.ok) {
      console.error(`❌ Uniswap API error: ${response.status} ${response.statusText}`);
      console.error('📍 URL:', response.url);
      
      // Log response text for debugging
      try {
        const errorText = await response.text();
        console.error('💥 Uniswap error response:', errorText);
      } catch (e) {
        console.error('💥 Could not read error response');
      }
      
      return null;
    }

    const result = await response.json();
    console.log('✅ Uniswap API response:', result);
    
    if (result.errors) {
      console.error('❌ Uniswap GraphQL errors:', result.errors);
      return null;
    }

    return result.data?.v3Pool || null;
  } catch (error) {
    console.error('💥 Error fetching Uniswap pool data:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
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
  // Transfer event fields
  from?: string;
  to?: string;
  value?: string;
  // Flow event fields
  sender?: string;
  receiver?: string;
  flowRate?: string;
  oldFlowRate?: string;
  // Pool event fields
  pool?: string;
  poolMember?: string;
  admin?: string;
  actualAmount?: string;
  attemptedAmount?: string;
  // Index event fields
  publisher?: string;
  indexId?: string;
  // Common field
  token: string;
}

// CFA Streams Interface
export interface CFAStream {
  id: string;
  sender: string;
  receiver: string;
  token: string;
  flowRate: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  currentFlowRate: string;
}

export async function fetchCFAStreams(tokenAddress: string, first = 10, skip = 0): Promise<CFAStream[]> {
  const query = `
    query CFAStreams($token: String!, $first: Int!, $skip: Int!) {
      streams(
        where: { 
          currentFlowRate_gt: "0"
          token: $token
        }
        orderBy: updatedAtTimestamp
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        id
        sender {
          id
        }
        receiver {
          id
        }
        token {
          id
        }
        currentFlowRate
        createdAtTimestamp
        updatedAtTimestamp
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
          first,
          skip 
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

    // Map the nested structure to flat structure
    const streams = (result.data?.streams || []).map((stream: any) => ({
      id: stream.id,
      sender: stream.sender.id,
      receiver: stream.receiver.id,
      token: stream.token.id,
      flowRate: stream.currentFlowRate,
      createdAtTimestamp: stream.createdAtTimestamp,
      updatedAtTimestamp: stream.updatedAtTimestamp,
      currentFlowRate: stream.currentFlowRate,
    }));

    return streams;
  } catch (error) {
    console.error("Error fetching CFA streams:", error);
    return [];
  }
}

// Account Streaming Data Interface
export interface AccountStreamingData {
  totalAmountStreamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  totalOutflowRate: string;
  totalInflowRate: string;
}

export async function fetchAccountStreamingData(tokenAddress: string, accountAddress: string): Promise<AccountStreamingData | null> {
  const query = `
    query AccountStreamingData($token: String!, $account: String!) {
      accountTokenSnapshots(
        where: { 
          token: $token
          account: $account
        }
        first: 1
      ) {
        totalAmountStreamedUntilUpdatedAt
        totalOutflowRate
        totalInflowRate
        updatedAtTimestamp
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
          account: accountAddress.toLowerCase(),
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();

    if (result.errors) {
      console.error("GraphQL errors (account streaming data):", result.errors);
      return null;
    }

    const snapshot = result.data?.accountTokenSnapshots?.[0];
    return snapshot || null;
  } catch (error) {
    console.error("Error fetching account streaming data:", error);
    return null;
  }
}

export async function fetchTokenEvents(tokenAddress: string, first = 10): Promise<TokenEvent[]> {
  const transferQuery = `
    query TransferEvents($token: String!, $first: Int!) {
      transferEvents(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        from
        to
        token
        value
      }
    }
  `;

  const flowQuery = `
    query FlowEvents($token: String!, $first: Int!) {
      flowUpdatedEvents(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        sender
        receiver
        token
        flowRate
        oldFlowRate
      }
    }
  `;

  const poolCreatedQuery = `
    query PoolCreatedEvents($token: String!, $first: Int!) {
      poolCreatedEvents(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        token
        admin
        pool
      }
    }
  `;

  const poolDistributionQuery = `
    query PoolDistributionEvents($token: String!, $first: Int!) {
      poolDistributionEvents(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        token
        pool
        poolMember
        actualAmount
        attemptedAmount
      }
    }
  `;

  const indexCreatedQuery = `
    query IndexCreatedEvents($token: String!, $first: Int!) {
      indexCreatedEvents(
        where: { token: $token }
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        id
        blockNumber
        timestamp
        transactionHash
        token
        publisher
        indexId
      }
    }
  `;

  try {
    // Fetch all event types
    const eventsPerType = Math.ceil(first / 5); // Distribute across 5 event types
    const [transferResponse, flowResponse, poolCreatedResponse, poolDistributionResponse, indexCreatedResponse] = await Promise.all([
      fetch(SUPERFLUID_SUBGRAPH_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: transferQuery,
          variables: { token: tokenAddress.toLowerCase(), first: eventsPerType },
        }),
      }),
      fetch(SUPERFLUID_SUBGRAPH_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: flowQuery,
          variables: { token: tokenAddress.toLowerCase(), first: eventsPerType },
        }),
      }),
      fetch(SUPERFLUID_SUBGRAPH_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: poolCreatedQuery,
          variables: { token: tokenAddress.toLowerCase(), first: eventsPerType },
        }),
      }),
      fetch(SUPERFLUID_SUBGRAPH_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: poolDistributionQuery,
          variables: { token: tokenAddress.toLowerCase(), first: eventsPerType },
        }),
      }),
      fetch(SUPERFLUID_SUBGRAPH_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: indexCreatedQuery,
          variables: { token: tokenAddress.toLowerCase(), first: eventsPerType },
        }),
      })
    ]);

    const [transferResult, flowResult, poolCreatedResult, poolDistributionResult, indexCreatedResult] = await Promise.all([
      transferResponse.json(),
      flowResponse.json(),
      poolCreatedResponse.json(),
      poolDistributionResponse.json(),
      indexCreatedResponse.json()
    ]);

    if (transferResult.errors) {
      console.error('Transfer events GraphQL errors:', transferResult.errors);
    }
    if (flowResult.errors) {
      console.error('Flow events GraphQL errors:', flowResult.errors);
    }
    if (poolCreatedResult.errors) {
      console.error('Pool created events GraphQL errors:', poolCreatedResult.errors);
    }
    if (poolDistributionResult.errors) {
      console.error('Pool distribution events GraphQL errors:', poolDistributionResult.errors);
    }
    if (indexCreatedResult.errors) {
      console.error('Index created events GraphQL errors:', indexCreatedResult.errors);
    }

    // Combine and format events
    const transferEvents: TokenEvent[] = (transferResult.data?.transferEvents || []).map((event: any) => ({
      ...event,
      name: 'Transfer'
    }));

    const flowEvents: TokenEvent[] = (flowResult.data?.flowUpdatedEvents || []).map((event: any) => ({
      ...event,
      name: 'FlowUpdated'
    }));

    const poolCreatedEvents: TokenEvent[] = (poolCreatedResult.data?.poolCreatedEvents || []).map((event: any) => ({
      ...event,
      name: 'PoolCreated'
    }));

    const poolDistributionEvents: TokenEvent[] = (poolDistributionResult.data?.poolDistributionEvents || []).map((event: any) => ({
      ...event,
      name: 'PoolDistribution'
    }));

    const indexCreatedEvents: TokenEvent[] = (indexCreatedResult.data?.indexCreatedEvents || []).map((event: any) => ({
      ...event,
      name: 'IndexCreated'
    }));

    // Combine all events and sort by timestamp
    const allEvents = [...transferEvents, ...flowEvents, ...poolCreatedEvents, ...poolDistributionEvents, ...indexCreatedEvents];
    allEvents.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

    // Return only the requested number of events
    return allEvents.slice(0, first);
  } catch (error) {
    console.error('Error fetching token events:', error);
    return [];
  }
}


