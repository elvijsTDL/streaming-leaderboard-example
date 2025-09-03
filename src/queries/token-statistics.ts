import { gql } from 'graphql-request';

// Token statistics GraphQL query
export const TOKEN_STATISTICS_QUERY = gql`
  query TokenStatistics($id: ID!) {
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

// TypeScript interface for the response
export interface TokenStatisticsResponse {
  tokenStatistic: {
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
  } | null;
}

// Variables for the query
export interface TokenStatisticsVariables {
  id: string;
}
