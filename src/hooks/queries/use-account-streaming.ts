import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '../../lib/graphql-client';
import { gql } from 'graphql-request';
import { 
  ACCOUNT_STREAMS_QUERY,
  type AccountStreamsResponse,
  type AccountStreamsVariables
} from '../../queries/account-streaming';

// Transform interface to match existing code
export interface AccountStreamingData {
  account: string;
  token: string;
  totalOutflowRate: string;
  totalInflowRate: string;
  totalAmountStreamedUntilUpdatedAt: string;
  totalAmountReceivedUntilUpdatedAt: string;
  balanceUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  isLiquidationEstimateOptimistic: boolean;
  maybeCriticalAtTimestamp: string | null;
}

export interface StreamData {
  id: string;
  sender: string;
  receiver: string;
  token: string;
  flowRate: string;
  streamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
  createdAtTimestamp: string;
}

export function useAccountStreamingData(
  tokenAddress: string, 
  accountAddress: string | null
) {
  return useQuery({
    queryKey: ['accountStreamingDataStreamsV2', tokenAddress, accountAddress],
    queryFn: async (): Promise<AccountStreamingData | null> => {
      if (!accountAddress) return null;

      // Use streams-based approach (same as volume leaderboard)
      const streamsQuery = gql`
        query UserStreams($tokenAddress: String!, $accountAddress: String!) {
          streams(
            where: { 
              sender: $accountAddress,
              token: $tokenAddress
            }
            first: 1000
          ) {
            id
            currentFlowRate
            streamedUntilUpdatedAt
            updatedAtTimestamp
            createdAtTimestamp
          }
        }
      `;

      const variables = {
        tokenAddress: tokenAddress.toLowerCase(),
        accountAddress: accountAddress.toLowerCase(),
      };

      const response = await graphqlClient.request<{
        streams: Array<{
          id: string;
          currentFlowRate: string;
          streamedUntilUpdatedAt: string;
          updatedAtTimestamp: string;
          createdAtTimestamp: string;
        }>;
      }>(streamsQuery, variables);

      if (!response.streams || response.streams.length === 0) {
        return null;
      }

      // Calculate real-time total for each stream, then sum them up
      const currentTimestamp = Math.floor(Date.now() / 1000);
      let totalStreamedAmount = BigInt(0);
      let totalCurrentFlowRate = BigInt(0);

      response.streams.forEach(stream => {
        // Calculate current total for this individual stream (including real-time streaming)
        const streamBaseAmount = BigInt(stream.streamedUntilUpdatedAt);
        const streamFlowRate = BigInt(stream.currentFlowRate);
        const streamUpdatedAt = parseInt(stream.updatedAtTimestamp);
        
        // Add ongoing streaming since stream's last update
        const timeSinceStreamUpdate = Math.max(0, currentTimestamp - streamUpdatedAt);
        const additionalStreamed = streamFlowRate * BigInt(timeSinceStreamUpdate);
        const streamCurrentTotal = streamBaseAmount + additionalStreamed;
        
        // Sum up across all streams
        totalStreamedAmount += streamCurrentTotal;
        totalCurrentFlowRate += streamFlowRate;
      });

      return {
        account: accountAddress.toLowerCase(),
        token: tokenAddress.toLowerCase(),
        totalOutflowRate: totalCurrentFlowRate.toString(),
        totalInflowRate: "0", // We're only tracking outflow here
        totalAmountStreamedUntilUpdatedAt: totalStreamedAmount.toString(),
        totalAmountReceivedUntilUpdatedAt: "0",
        balanceUntilUpdatedAt: "0",
        updatedAtTimestamp: currentTimestamp.toString(),
        isLiquidationEstimateOptimistic: false,
        maybeCriticalAtTimestamp: null,
      };
    },
    staleTime: 10 * 1000, // Consider data fresh for 10 seconds (more frequent updates for account data)
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    retry: 3,
    enabled: !!tokenAddress && !!accountAddress,
  });
}

export function useAccountStreams(
  tokenAddress: string, 
  accountAddress: string | null,
  first: number = 10,
  skip: number = 0
) {
  return useQuery({
    queryKey: ['accountStreams', tokenAddress, accountAddress, first, skip],
    queryFn: async (): Promise<StreamData[]> => {
      if (!accountAddress) return [];

      const variables: AccountStreamsVariables = {
        tokenAddress: tokenAddress.toLowerCase(),
        accountAddress: accountAddress.toLowerCase(),
        first,
        skip,
      };

      const response = await graphqlClient.request<AccountStreamsResponse>(
        ACCOUNT_STREAMS_QUERY,
        variables
      );

      return response.streams.map(stream => ({
        id: stream.id,
        sender: stream.sender.id,
        receiver: stream.receiver.id,
        token: stream.token.id,
        flowRate: stream.flowRate,
        streamedUntilUpdatedAt: stream.streamedUntilUpdatedAt,
        updatedAtTimestamp: stream.updatedAtTimestamp,
        createdAtTimestamp: stream.createdAtTimestamp,
      }));
    },
    staleTime: 10 * 1000, // Consider data fresh for 10 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    retry: 3,
    enabled: !!tokenAddress && !!accountAddress,
  });
}
