import { gql } from 'graphql-request';

// Account streaming data query
export const ACCOUNT_STREAMING_DATA_QUERY = gql`
  query AccountStreamingData($tokenAddress: String!, $accountAddress: String!) {
    accountTokenSnapshots(
      where: { 
        token: $tokenAddress, 
        account: $accountAddress 
      }
      first: 1
    ) {
      account { id }
      token { id }
      totalOutflowRate
      totalInflowRate
      totalAmountStreamedUntilUpdatedAt
      totalAmountReceivedUntilUpdatedAt
      balanceUntilUpdatedAt
      updatedAtTimestamp
      isLiquidationEstimateOptimistic
      maybeCriticalAtTimestamp
    }
  }
`;

// Account streams query (for detailed stream info)
export const ACCOUNT_STREAMS_QUERY = gql`
  query AccountStreams($tokenAddress: String!, $accountAddress: String!, $first: Int!, $skip: Int!) {
    streams(
      where: { 
        token: $tokenAddress,
        or: [
          { sender: $accountAddress },
          { receiver: $accountAddress }
        ]
      }
      orderBy: createdAtTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      sender { id }
      receiver { id }
      token { id }
      flowRate
      streamedUntilUpdatedAt
      updatedAtTimestamp
      createdAtTimestamp
    }
  }
`;

// TypeScript interfaces
export interface AccountTokenSnapshot {
  account: { id: string };
  token: { id: string };
  totalOutflowRate: string;
  totalInflowRate: string;
  totalAmountStreamedUntilUpdatedAt: string;
  totalAmountReceivedUntilUpdatedAt: string;
  balanceUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  isLiquidationEstimateOptimistic: boolean;
  maybeCriticalAtTimestamp: string | null;
}

export interface StreamEntry {
  id: string;
  sender: { id: string };
  receiver: { id: string };
  token: { id: string };
  flowRate: string;
  streamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  createdAtTimestamp: string;
}

export interface AccountStreamingDataResponse {
  accountTokenSnapshots: AccountTokenSnapshot[];
}

export interface AccountStreamsResponse {
  streams: StreamEntry[];
}

// Variables
export interface AccountStreamingDataVariables {
  tokenAddress: string;
  accountAddress: string;
}

export interface AccountStreamsVariables {
  tokenAddress: string;
  accountAddress: string;
  first: number;
  skip: number;
}
