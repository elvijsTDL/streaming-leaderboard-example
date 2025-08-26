This is a [Vite](https://vitejs.dev) project bootstrapped with [`@farcaster/create-mini-app`](https://github.com/farcasterxyz/miniapps/tree/main/packages/create-mini-app).

For documentation and guides, visit [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/docs/getting-started).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Reown/WalletConnect Project ID
VITE_REOWN_PROJECT_ID=your_project_id_here

# Token Configuration
# The address of the Superfluid token to track
VITE_TOKEN_ADDRESS=0x1c4f69f14cf754333c302246d25a48a13224118a

# The symbol/ticker of the token to display in the UI
VITE_TOKEN_SYMBOL=BUTTHOLE

# Social Links (Optional)
# Official X (formerly Twitter) profile URL
VITE_X_URL=https://twitter.com/your_token_handle

# Official Farcaster profile URL  
VITE_FARCASTER_URL=https://warpcast.com/your_token_handle

# Official Telegram group or channel URL
VITE_TELEGRAM_URL=https://t.me/your_token_group

# Official website URL
VITE_WEBSITE_URL=https://your-token-website.com
```

The app will use these environment variables to configure which Superfluid token to track for streaming leaderboards and statistics. If not provided, it defaults to the BUTTHOLE token address shown above.

Social links are optional - if provided, they will display as official profile/page links. If not provided, those social media buttons will not be shown (only DEXScreener, BaseScan, and Copy Contract will always be available).

## `farcaster.json`

The `/.well-known/farcaster.json` is served from the [public
directory](https://vite.dev/guide/assets) and can be updated by editing
`./public/.well-known/farcaster.json`.

You can also use the `public` directory to serve a static image for `splashBackgroundImageUrl`.

## Frame Embed

Add a the `fc:frame` in `index.html` to make your root app URL sharable in feeds:

```html
  <head>
    <!--- other tags --->
    <meta name="fc:frame" content='{"version":"next","imageUrl":"https://placehold.co/900x600.png?text=Frame%20Image","button":{"title":"Open","action":{"type":"launch_frame","name":"App Name","url":"https://app.com"}}}' /> 
  </head>
```

