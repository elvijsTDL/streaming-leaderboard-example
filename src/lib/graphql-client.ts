import { GraphQLClient } from 'graphql-request';

export const SUPERFLUID_SUBGRAPH_BASE =
  "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1";

// Create a GraphQL client instance
export const graphqlClient = new GraphQLClient(SUPERFLUID_SUBGRAPH_BASE, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic GraphQL error type
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

// Generic GraphQL response type
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
