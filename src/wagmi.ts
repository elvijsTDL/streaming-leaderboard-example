import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { 
  base, 
  polygon, 
  optimism, 
  arbitrum, 
  mainnet, 
  gnosis,
  optimismSepolia,
  sepolia,
  avalancheFuji 
} from "@reown/appkit/networks";
import { http, createConfig } from "wagmi";
import { 
  base as baseChain, 
  polygon as polygonChain, 
  optimism as optimismChain, 
  arbitrum as arbitrumChain, 
  mainnet as mainnetChain,
  gnosis as gnosisChain,
  optimismSepolia as optimismSepoliaChain,
  sepolia as sepoliaChain,
  avalancheFuji as avalancheFujiChain,
  scrollSepolia as scrollSepoliaChain
} from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected, walletConnect } from "wagmi/connectors";

export const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ?? "";

// Network configuration
const CHAIN_ID = parseInt((import.meta.env.VITE_CHAIN_ID as string) ?? "8453", 10);

// Network configurations
const getNetworkConfig = (chainId: number) => {
  switch (chainId) {
    // Mainnet networks
    case 8453:
      return {
        appKitNetwork: base,
        wagmiChain: baseChain,
      };
    case 137:
      return {
        appKitNetwork: polygon,
        wagmiChain: polygonChain,
      };
    case 10:
      return {
        appKitNetwork: optimism,
        wagmiChain: optimismChain,
      };
    case 42161:
      return {
        appKitNetwork: arbitrum,
        wagmiChain: arbitrumChain,
      };
    case 1:
      return {
        appKitNetwork: mainnet,
        wagmiChain: mainnetChain,
      };
    case 100:
      return {
        appKitNetwork: gnosis,
        wagmiChain: gnosisChain,
      };
    // Testnet networks
    case 11155420:
      return {
        appKitNetwork: optimismSepolia,
        wagmiChain: optimismSepoliaChain,
      };
    case 11155111:
      return {
        appKitNetwork: sepolia,
        wagmiChain: sepoliaChain,
      };
    case 43113:
      return {
        appKitNetwork: avalancheFuji,
        wagmiChain: avalancheFujiChain,
      };
    case 534351:
      return {
        appKitNetwork: undefined, // Scroll Sepolia not available in AppKit networks yet
        wagmiChain: scrollSepoliaChain,
      };
    default:
      return {
        appKitNetwork: base,
        wagmiChain: baseChain,
      };
  }
};

const networkConfig = getNetworkConfig(CHAIN_ID);
export const currentAppKitNetwork = networkConfig.appKitNetwork;
export const currentWagmiChain = networkConfig.wagmiChain;

// AppKit adapter for fallback/development environments
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: currentAppKitNetwork ? [currentAppKitNetwork] : [base], // Fallback to base if AppKit network not available
  ssr: false,
});

// Following the official Farcaster MiniApp guide with additional connectors for fallback
export const config = createConfig({
  chains: [currentWagmiChain] as const,
  transports: {
    [currentWagmiChain.id]: http(),
  } as any, // Type assertion to bypass strict typing
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
