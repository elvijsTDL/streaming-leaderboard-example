import { GraphQLClient } from 'graphql-request';
import { SUPERFLUID_SUBGRAPH_BASE } from './superfluid';

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
