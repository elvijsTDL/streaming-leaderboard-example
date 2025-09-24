import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { SUPERFLUID_SUBGRAPH_BASE, TOKEN_ADDRESS } from '../../lib/superfluid';
import {
  LATEST_GDA_POOLS_QUERY,
  ACTIVE_GDA_POOLS_QUERY,
  GDA_POOL_DETAILS_QUERY,
  GDA_POOL_MEMBERS_QUERY,
  GDA_POOL_DISTRIBUTORS_QUERY,
  CHECK_POOL_ADMIN_QUERY,
  type LatestGDAPoolsResponse,
  type GDAPoolDetailsResponse,
  type GDAPoolMembersResponse,
  type GDAPoolDistributorsResponse,
  type CheckPoolAdminResponse,
  type GDAPoolQueryVariables,
  type GDAPoolDetailsVariables,
  type CheckPoolAdminVariables,
} from '../../queries/gda-pools';

export function useLatestGDAPools(first = 20, skip = 0) {
  return useQuery({
    queryKey: ['latest-gda-pools', TOKEN_ADDRESS, first, skip],
    queryFn: async (): Promise<LatestGDAPoolsResponse> => {
      const variables: GDAPoolQueryVariables = {
        token: TOKEN_ADDRESS.toLowerCase(),
        first,
        skip,
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, LATEST_GDA_POOLS_QUERY, variables);
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  });
}

export function useActiveGDAPools(first = 20, skip = 0) {
  return useQuery({
    queryKey: ['active-gda-pools', TOKEN_ADDRESS, first, skip],
    queryFn: async (): Promise<LatestGDAPoolsResponse> => {
      const variables: GDAPoolQueryVariables = {
        token: TOKEN_ADDRESS.toLowerCase(),
        first,
        skip,
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, ACTIVE_GDA_POOLS_QUERY, variables);
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  });
}

export function useGDAPoolDetails(poolAddress: string | null) {
  return useQuery({
    queryKey: ['gda-pool-details', poolAddress],
    queryFn: async (): Promise<GDAPoolDetailsResponse> => {
      if (!poolAddress) throw new Error('Pool address required');
      const variables: GDAPoolDetailsVariables = {
        poolAddress: poolAddress.toLowerCase(),
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, GDA_POOL_DETAILS_QUERY, variables);
    },
    enabled: !!poolAddress,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useGDAPoolMembers(poolAddress: string | null, first = 50, skip = 0) {
  return useQuery({
    queryKey: ['gda-pool-members', poolAddress, first, skip],
    queryFn: async (): Promise<GDAPoolMembersResponse> => {
      if (!poolAddress) throw new Error('Pool address required');
      const variables = {
        poolAddress: poolAddress.toLowerCase(),
        first,
        skip,
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, GDA_POOL_MEMBERS_QUERY, variables);
    },
    enabled: !!poolAddress,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useGDAPoolDistributors(poolAddress: string | null, first = 20, skip = 0) {
  return useQuery({
    queryKey: ['gda-pool-distributors', poolAddress, first, skip],
    queryFn: async (): Promise<GDAPoolDistributorsResponse> => {
      if (!poolAddress) throw new Error('Pool address required');
      const variables = {
        poolAddress: poolAddress.toLowerCase(),
        first,
        skip,
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, GDA_POOL_DISTRIBUTORS_QUERY, variables);
    },
    enabled: !!poolAddress,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCheckPoolAdmin(accountAddress: string | null) {
  return useQuery({
    queryKey: ['check-pool-admin', accountAddress, TOKEN_ADDRESS],
    queryFn: async (): Promise<CheckPoolAdminResponse> => {
      if (!accountAddress) throw new Error('Account address required');
      const variables: CheckPoolAdminVariables = {
        account: accountAddress.toLowerCase(),
        token: TOKEN_ADDRESS.toLowerCase(),
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, CHECK_POOL_ADMIN_QUERY, variables);
    },
    enabled: !!accountAddress,
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // 2 minutes
  });
}
