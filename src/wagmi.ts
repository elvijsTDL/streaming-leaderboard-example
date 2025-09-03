import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { createConfig } from "wagmi";
import { http } from "viem";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";

export const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ?? "";

// Default AppKit adapter for non-frame environments
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
  ssr: false,
});

// Enhanced config that includes MiniApp connector for frame environments
export const config = createConfig({
  chains: [base],
  connectors: [
    ...wagmiAdapter.wagmiConfig.connectors,
    farcasterFrame(),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
