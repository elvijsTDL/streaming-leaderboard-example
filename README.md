# Streaming Leaderboard Example

A multi-network streaming leaderboard built with React, Vite, and Superfluid Protocol.

## Features

- Multi-network support (Base, Polygon, Optimism, Arbitrum, Ethereum, Gnosis Chain)
- Real-time streaming data visualization
- Token statistics and leaderboards
- Pool management (GDA)
- Wrap/unwrap token functionality
- Analytics and events tracking

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streaming-leaderboard-example
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```bash
   # Required: Set the network you want to use
   VITE_CHAIN_ID=8453      # Base (default)
   # VITE_CHAIN_ID=11155420 # Optimism Sepolia (testnet)
   
   # Optional: Your Reown project ID for wallet connections
   VITE_REOWN_PROJECT_ID=your_project_id
   
   # Optional: Token configuration (defaults provided)
   VITE_TOKEN_ADDRESS=0x3B3Cd21242BA44e9865B066e5EF5d1cC1030CC58
   VITE_TOKEN_SYMBOL=STREME
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

## Supported Networks

The app supports the following networks. Simply set `VITE_CHAIN_ID` to the desired network:

### Mainnet Networks
| Network | Chain ID | 
|---------|----------|
| Base (default) | `8453` |
| Polygon | `137` |
| Optimism | `10` |
| Arbitrum One | `42161` |
| Ethereum | `1` |
| Gnosis Chain | `100` |

### Testnet Networks
| Network | Chain ID | 
|---------|----------|
| **Optimism Sepolia** | `11155420` |
| Ethereum Sepolia | `11155111` |
| Avalanche Fuji | `43113` |
| Scroll Sepolia | `534351` |

> **Note**: Optimism Sepolia is fully supported with all Superfluid features including vesting, flow scheduler, and auto-wrap subgraphs.

## Environment Variables

### Required
- `VITE_CHAIN_ID` - The chain ID of the network to use

### Optional
- `VITE_REOWN_PROJECT_ID` - Your Reown (WalletConnect) project ID
- `VITE_TOKEN_ADDRESS` - The token address to track (defaults to STREME)
- `VITE_TOKEN_SYMBOL` - The token symbol (defaults to STREME)
- `VITE_X_URL` - Twitter/X URL for social links
- `VITE_FARCASTER_URL` - Farcaster URL for social links
- `VITE_TELEGRAM_URL` - Telegram URL for social links
- `VITE_WEBSITE_URL` - Website URL for social links

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Web3**: Wagmi, Viem, Reown AppKit
- **Protocol**: Superfluid Protocol
- **Data**: The Graph (Subgraph queries)
- **State**: TanStack Query

## Project Structure

```
src/
├── components/          # React components
│   ├── pages/          # Page components
│   └── ui/             # UI components
├── hooks/              # Custom hooks
│   └── queries/        # Data fetching hooks
├── lib/                # Utility libraries
│   ├── superfluid.ts   # Superfluid integration
│   ├── graphql-client.ts # GraphQL client
│   └── wagmi.ts        # Web3 configuration
└── queries/            # GraphQL queries
```

## Development

- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
- **Preview**: `pnpm preview`

## Deployment

1. Build the project:
   ```bash
   pnpm build
   ```