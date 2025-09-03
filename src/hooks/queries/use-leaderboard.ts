import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '../../lib/graphql-client';
import { 
  TOP_FLOW_RATE_LEADERS_QUERY,
  TOP_VOLUME_LEADERS_STREAMS_QUERY,
  type TopFlowRateLeadersResponse,
  type TopVolumeLeadersStreamsResponse,
  type LeaderboardQueryVariables
} from '../../queries/leaderboard';

// Transform interfaces to match existing code
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

export function useTopFlowRateLeaders(
  tokenAddress: string, 
  first: number = 10, 
  skip: number = 0
) {
  return useQuery({
    queryKey: ['topFlowRateLeaders', tokenAddress, first, skip],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const variables: LeaderboardQueryVariables = {
        token: tokenAddress.toLowerCase(),
        first,
        skip,
      };

      const response = await graphqlClient.request<TopFlowRateLeadersResponse>(
        TOP_FLOW_RATE_LEADERS_QUERY,
        variables
      );

      return response.accountTokenSnapshots.map(entry => ({
        account: entry.account.id,
        value: entry.totalCFAOutflowRate,
      }));
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    enabled: !!tokenAddress,
  });
}

export function useTopVolumeLeaders(
  tokenAddress: string,
  first: number = 10,
  skip: number = 0
) {
  return useQuery({
    queryKey: ['topVolumeLeadersStreams', tokenAddress, first, skip],
    queryFn: async (): Promise<VolumeLeaderboardEntry[]> => {
      // Fetch a large number of streams to get all active streamers
      const variables = {
        token: tokenAddress.toLowerCase(),
        first: 1000, // Get enough streams to cover all potential streamers
      };

      const response = await graphqlClient.request<TopVolumeLeadersStreamsResponse>(
        TOP_VOLUME_LEADERS_STREAMS_QUERY,
        variables
      );

      // Group streams by sender address
      const streamsBySender = new Map<string, typeof response.streams>();
      
      response.streams.forEach(stream => {
        const sender = stream.sender.id.toLowerCase();
        if (!streamsBySender.has(sender)) {
          streamsBySender.set(sender, []);
        }
        streamsBySender.get(sender)!.push(stream);
      });

      // Calculate total for each sender
      const senderTotals = Array.from(streamsBySender.entries()).map(([sender, streams]) => {
        // Sum up all streams for this sender
        let totalStreamedAmount = BigInt(0);
        let totalCurrentFlowRate = BigInt(0);
        let latestUpdateTimestamp = 0;

        streams.forEach(stream => {
          totalStreamedAmount += BigInt(stream.streamedUntilUpdatedAt);
          totalCurrentFlowRate += BigInt(stream.currentFlowRate);
          latestUpdateTimestamp = Math.max(latestUpdateTimestamp, parseInt(stream.updatedAtTimestamp));
        });

        return {
          account: sender,
          totalAmountStreamedUntilUpdatedAt: totalStreamedAmount.toString(),
          updatedAtTimestamp: latestUpdateTimestamp.toString(),
          totalOutflowRate: totalCurrentFlowRate.toString(),
        };
      });

      // Sort by total amount streamed (descending) and apply pagination
      const sortedSenders = senderTotals
        .filter(entry => BigInt(entry.totalAmountStreamedUntilUpdatedAt) > 0n)
        .sort((a, b) => {
          const aTotal = BigInt(a.totalAmountStreamedUntilUpdatedAt);
          const bTotal = BigInt(b.totalAmountStreamedUntilUpdatedAt);
          return bTotal > aTotal ? 1 : bTotal < aTotal ? -1 : 0;
        })
        .slice(skip, skip + first);

      return sortedSenders;
    },
    staleTime: 10 * 1000, // More frequent updates since we're calculating real-time data
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    retry: 3,
    enabled: !!tokenAddress,
  });
}
