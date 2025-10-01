# Network-Specific Behavior Examples

## Base Network (8453) - Full Feature Set
```bash
# .env configuration
VITE_CHAIN_ID=8453

# Available features:
✅ Stats Dashboard
✅ Leaderboard
✅ Streams
✅ Events  
✅ Streme Tab (Trading/Analytics)
✅ Yoink - WIP
✅ Wrap
✅ GDA Pools

# UI Elements:
✅ StremeCard shows full Streme market data
✅ Navigation header: "Your one stop shop for all $STREME things"
✅ Full analytics page with TokenChart + StremeCard
```

## Optimism Sepolia (11155420) - Core Features
```bash
# .env configuration
VITE_CHAIN_ID=11155420

# Available features:
✅ Stats Dashboard
✅ Leaderboard
✅ Streams
✅ Events
❌ Streme Tab (Hidden - not available)
✅ Yoink - WIP
✅ Wrap
✅ GDA Pools

# UI Elements:
ℹ️ StremeCard shows: "Streme data is only available on Base network"
✅ Navigation header: "Your dashboard for [TOKEN_SYMBOL] streaming"
✅ Analytics page shows only TokenChart (StremeCard hidden)
```

## Other Networks (Polygon, Ethereum, etc.)
```bash
# Same behavior as Optimism Sepolia
# Core Superfluid features available
# Streme-specific features gracefully hidden
```

## Automatic Behavior

### Navigation Protection
- If user tries to access `/trading` page on non-Base network → automatically redirects to `/stats`
- Streme tab is completely hidden from navigation on non-Base networks

### Component Protection  
- `StremeCard` shows informative message instead of attempting to load data
- `AnalyticsPage` adjusts layout to full-width when StremeCard is hidden
- Navigation header text adapts to network context

### User Experience
- No broken API calls or error states
- Clear messaging about network limitations
- Seamless experience across all supported networks



