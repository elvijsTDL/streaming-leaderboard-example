import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { SUPERFLUID_SUBGRAPH_BASE, TOKEN_ADDRESS } from '../../lib/superfluid';
import { gql } from 'graphql-request';

// Query to get pools where user is a member
const USER_POOL_MEMBERSHIPS_QUERY = gql`
  query UserPoolMemberships($account: String!, $token: String!, $first: Int!, $skip: Int!) {
    poolMembers(
      where: { 
        account: $account,
        units_gt: "0",
        pool_: { token: $token }
      }
      orderBy: updatedAtTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      account {
        id
      }
      pool {
        id
        token {
          id
          symbol
          name
        }
        admin {
          id
        }
        totalMembers
        totalUnits
        totalConnectedUnits
        totalDisconnectedUnits
        flowRate
        totalConnectedMembers
        totalDisconnectedMembers
        totalAmountDistributedUntilUpdatedAt
        totalAmountFlowedDistributedUntilUpdatedAt
        createdAtTimestamp
        updatedAtTimestamp
      }
      units
      isConnected
      totalAmountReceivedUntilUpdatedAt
      updatedAtTimestamp
    }
  }
`;

export interface UserPoolMembership {
  id: string;
  account: {
    id: string;
  };
  pool: {
    id: string;
    token: {
      id: string;
      symbol: string;
      name: string;
    };
    admin: {
      id: string;
    };
    totalMembers: number;
    totalUnits: string;
    flowRate: string;
    totalConnectedMembers: number;
    createdAtTimestamp: string;
    updatedAtTimestamp: string;
  };
  units: string;
  isConnected: boolean;
  totalAmountReceivedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
}

interface UserPoolMembershipsResponse {
  poolMembers: UserPoolMembership[];
}

interface UserPoolMembershipsVariables {
  account: string;
  token: string;
  first: number;
  skip: number;
}

export function useUserPoolMemberships(accountAddress: string | null, first = 10, skip = 0) {
  return useQuery({
    queryKey: ['user-pool-memberships', accountAddress, TOKEN_ADDRESS, first, skip],
    queryFn: async (): Promise<UserPoolMembershipsResponse> => {
      if (!accountAddress) throw new Error('Account address required');
      const variables: UserPoolMembershipsVariables = {
        account: accountAddress.toLowerCase(),
        token: TOKEN_ADDRESS.toLowerCase(),
        first,
        skip,
      };
      return request(SUPERFLUID_SUBGRAPH_BASE, USER_POOL_MEMBERSHIPS_QUERY, variables);
    },
    enabled: !!accountAddress,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
