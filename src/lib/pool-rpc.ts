import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';

// Create a public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://developer-access-mainnet.base.org'),
});

// SuperfluidPool ABI for reading pool data
const POOL_ABI = [
  {
    type: 'function',
    name: 'getTotalUnits',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalConnectedUnits',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalDisconnectedUnits',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalFlowRate',
    inputs: [],
    outputs: [{ name: '', type: 'int96' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUnits',
    inputs: [{ name: 'memberAddr', type: 'address' }],
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'admin',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'superToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
] as const;

export interface PoolRPCData {
  totalUnits: string;
  totalConnectedUnits: string;
  totalDisconnectedUnits: string;
  totalFlowRate: string;
  admin: string;
  superToken: string;
}

export async function fetchPoolDataFromRPC(poolAddress: string): Promise<PoolRPCData | null> {
  try {
    const [
      totalUnits,
      totalConnectedUnits,
      totalDisconnectedUnits,
      totalFlowRate,
      admin,
      superToken
    ] = await publicClient.multicall({
      contracts: [
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'getTotalUnits',
        },
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'getTotalConnectedUnits',
        },
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'getTotalDisconnectedUnits',
        },
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'getTotalFlowRate',
        },
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'admin',
        },
        {
          address: poolAddress as Address,
          abi: POOL_ABI,
          functionName: 'superToken',
        }
      ],
    });

    if (
      totalUnits.status !== 'success' ||
      totalConnectedUnits.status !== 'success' ||
      totalDisconnectedUnits.status !== 'success' ||
      totalFlowRate.status !== 'success' ||
      admin.status !== 'success' ||
      superToken.status !== 'success'
    ) {
      return null;
    }

    return {
      totalUnits: totalUnits.result.toString(),
      totalConnectedUnits: totalConnectedUnits.result.toString(),
      totalDisconnectedUnits: totalDisconnectedUnits.result.toString(),
      totalFlowRate: totalFlowRate.result.toString(),
      admin: admin.result,
      superToken: superToken.result,
    };
  } catch (error) {
    console.error('Error fetching pool data from RPC:', error);
    return null;
  }
}

export async function fetchMemberUnitsFromRPC(poolAddress: string, memberAddress: string): Promise<string | null> {
  try {
    const result = await publicClient.readContract({
      address: poolAddress as Address,
      abi: POOL_ABI,
      functionName: 'getUnits',
      args: [memberAddress as Address],
    });

    return result.toString();
  } catch (error) {
    console.error('Error fetching member units from RPC:', error);
    return null;
  }
}
