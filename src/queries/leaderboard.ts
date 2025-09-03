import { gql } from 'graphql-request';

// Top flow rate leaders query
export const TOP_FLOW_RATE_LEADERS_QUERY = gql`
  query TopFlowRateLeaders($token: String!, $first: Int!, $skip: Int!) {
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

// Top volume leaders query - gets all active and past streams to calculate totals properly
export const TOP_VOLUME_LEADERS_STREAMS_QUERY = gql`
  query TopVolumeLeadersStreams($token: String!, $first: Int!) {
    streams(
      where: { 
        token: $token,
        streamedUntilUpdatedAt_gt: 0
      }
      orderBy: streamedUntilUpdatedAt
      orderDirection: desc
      first: $first
    ) {
      id
      sender { id }
      receiver { id }
      currentFlowRate
      streamedUntilUpdatedAt
      updatedAtTimestamp
      createdAtTimestamp
    }
  }
`;

// TypeScript interfaces for responses
export interface FlowRateLeaderEntry {
  account: { id: string };
  totalCFAOutflowRate: string;
}

export interface VolumeLeaderEntry {
  account: { id: string };
  totalCFAAmountStreamedOutUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  totalCFAOutflowRate: string;
}

export interface StreamEntry {
  id: string;
  sender: { id: string };
  receiver: { id: string };
  currentFlowRate: string;
  streamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  createdAtTimestamp: string;
}

export interface TopFlowRateLeadersResponse {
  accountTokenSnapshots: FlowRateLeaderEntry[];
}

export interface TopVolumeLeadersResponse {
  accountTokenSnapshots: VolumeLeaderEntry[];
}

export interface TopVolumeLeadersStreamsResponse {
  streams: StreamEntry[];
}

// Variables for the queries
export interface LeaderboardQueryVariables {
  token: string;
  first: number;
  skip: number;
}
