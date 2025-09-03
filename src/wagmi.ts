import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { http, createConfig } from "wagmi";
import { base as baseChain } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected, walletConnect } from "wagmi/connectors";

export const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ?? "";

// AppKit adapter for fallback/development environments
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
  ssr: false,
});

// Following the official Farcaster MiniApp guide with additional connectors for fallback
export const config = createConfig({
  chains: [baseChain],
  transports: {
    [baseChain.id]: http(),
  },
  connectors: [
    miniAppConnector(),
    // Additional connectors for non-MiniApp environments
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ]
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
