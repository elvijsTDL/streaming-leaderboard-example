import { gql } from 'graphql-request';

// GDA Pool interfaces
export interface GDAPool {
  id: string; // This is the pool address
  token: {
    id: string;
    symbol: string;
    name: string;
  };
  admin: {
    id: string;
  };
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  totalUnits: string;
  totalAmountFlowedDistributedUntilUpdatedAt: string;
  totalAmountDistributedUntilUpdatedAt: string;
  totalMembers: number;
  flowRate: string;
  totalConnectedMembers: number;
  totalDisconnectedMembers: number;
}

export interface GDAPoolMember {
  id: string;
  account: {
    id: string;
  };
  pool: {
    id: string; // This is the pool address
  };
  units: string;
  isConnected: boolean;
  totalAmountReceivedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
}

export interface GDAPoolDistributor {
  id: string;
  account: {
    id: string;
  };
  pool: {
    id: string; // This is the pool address
  };
  flowRate: string;
  totalAmountFlowedDistributedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
}

// Query to get latest GDA pools for a specific token, prioritizing active pools
export const LATEST_GDA_POOLS_QUERY = gql`
  query LatestGDAPools($token: String!, $first: Int!, $skip: Int!) {
    pools(
      where: { token: $token }
      orderBy: updatedAtTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      token {
        id
        symbol
        name
      }
      admin {
        id
      }
      createdAtTimestamp
      updatedAtTimestamp
      totalUnits
      totalAmountFlowedDistributedUntilUpdatedAt
      totalAmountDistributedUntilUpdatedAt
      totalMembers
      flowRate
      totalConnectedMembers
      totalDisconnectedMembers
    }
  }
`;

// Query to get active GDA pools (pools with members/units) for a specific token
export const ACTIVE_GDA_POOLS_QUERY = gql`
  query ActiveGDAPools($token: String!, $first: Int!, $skip: Int!) {
    pools(
      where: { 
        token: $token,
        totalMembers_gt: 0
      }
      orderBy: totalUnits
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      token {
        id
        symbol
        name
      }
      admin {
        id
      }
      createdAtTimestamp
      updatedAtTimestamp
      totalUnits
      totalAmountFlowedDistributedUntilUpdatedAt
      totalAmountDistributedUntilUpdatedAt
      totalMembers
      flowRate
      totalConnectedMembers
      totalDisconnectedMembers
    }
  }
`;

// Query to get pool details by address
export const GDA_POOL_DETAILS_QUERY = gql`
  query GDAPoolDetails($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      token {
        id
        symbol
        name
      }
      admin {
        id
      }
      createdAtTimestamp
      updatedAtTimestamp
      totalUnits
      totalAmountFlowedDistributedUntilUpdatedAt
      totalAmountDistributedUntilUpdatedAt
      totalMembers
      flowRate
      totalConnectedMembers
      totalDisconnectedMembers
    }
  }
`;

// Query to get pool members, sorted by total received (top receivers first)
export const GDA_POOL_MEMBERS_QUERY = gql`
  query GDAPoolMembers($poolAddress: String!, $first: Int!, $skip: Int!) {
    poolMembers(
      where: { pool: $poolAddress }
      orderBy: totalAmountReceivedUntilUpdatedAt
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
      }
      units
      isConnected
      totalAmountReceivedUntilUpdatedAt
      updatedAtTimestamp
    }
  }
`;

// Query to get pool distributors (accounts flowing to the pool)
export const GDA_POOL_DISTRIBUTORS_QUERY = gql`
  query GDAPoolDistributors($poolAddress: String!, $first: Int!, $skip: Int!) {
    poolDistributors(
      where: { pool: $poolAddress, flowRate_gt: "0" }
      orderBy: flowRate
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
      }
      flowRate
      totalAmountFlowedDistributedUntilUpdatedAt
      updatedAtTimestamp
    }
  }
`;

// Query to check if an account is admin of specific pools
export const CHECK_POOL_ADMIN_QUERY = gql`
  query CheckPoolAdmin($account: String!, $token: String!) {
    pools(
      where: { 
        admin: $account,
        token: $token
      }
    ) {
      id
      token {
        id
        symbol
        name
      }
      totalMembers
      totalUnits
      flowRate
    }
  }
`;

// Response types
export interface LatestGDAPoolsResponse {
  pools: GDAPool[];
}

export interface GDAPoolDetailsResponse {
  pool: GDAPool | null;
}

export interface GDAPoolMembersResponse {
  poolMembers: GDAPoolMember[];
}

export interface GDAPoolDistributorsResponse {
  poolDistributors: GDAPoolDistributor[];
}

export interface CheckPoolAdminResponse {
  pools: GDAPool[];
}

// Query variables
export interface GDAPoolQueryVariables {
  token: string;
  first: number;
  skip: number;
}

export interface GDAPoolDetailsVariables {
  poolAddress: string;
}

export interface CheckPoolAdminVariables {
  account: string;
  token: string;
}
