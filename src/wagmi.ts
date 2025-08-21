import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";

export const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ?? "";

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
  ssr: false,
});

export const config = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
