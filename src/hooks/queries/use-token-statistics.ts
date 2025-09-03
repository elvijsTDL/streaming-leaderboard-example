import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '../../lib/graphql-client';
import { 
  TOKEN_STATISTICS_QUERY, 
  type TokenStatisticsResponse, 
  type TokenStatisticsVariables 
} from '../../queries/token-statistics';

// Transform the response to match the existing interface
export interface TokenStatistics {
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
}

export function useTokenStatistics(tokenAddress: string) {
  return useQuery({
    queryKey: ['tokenStatistics', tokenAddress],
    queryFn: async (): Promise<TokenStatistics | null> => {
      const variables: TokenStatisticsVariables = { 
        id: tokenAddress.toLowerCase() 
      };

      const response = await graphqlClient.request<TokenStatisticsResponse>(
        TOKEN_STATISTICS_QUERY,
        variables
      );

      if (!response.tokenStatistic) {
        return null;
      }

      return {
        totalNumberOfActiveStreams: response.tokenStatistic.totalNumberOfActiveStreams,
        totalCFANumberOfActiveStreams: response.tokenStatistic.totalCFANumberOfActiveStreams,
        totalGDANumberOfActiveStreams: response.tokenStatistic.totalGDANumberOfActiveStreams,
        totalNumberOfPools: response.tokenStatistic.totalNumberOfPools,
        totalNumberOfIndexes: response.tokenStatistic.totalNumberOfIndexes,
        totalNumberOfHolders: response.tokenStatistic.totalNumberOfHolders,
        totalNumberOfAccounts: response.tokenStatistic.totalNumberOfAccounts,
        totalOutflowRate: response.tokenStatistic.totalOutflowRate,
        totalCFAOutflowRate: response.tokenStatistic.totalCFAOutflowRate,
        totalGDAOutflowRate: response.tokenStatistic.totalGDAOutflowRate,
        totalAmountStreamedUntilUpdatedAt: response.tokenStatistic.totalAmountStreamedUntilUpdatedAt,
        totalSupply: response.tokenStatistic.totalSupply,
        updatedAtTimestamp: response.tokenStatistic.updatedAtTimestamp,
      };
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    enabled: !!tokenAddress,
  });
}
