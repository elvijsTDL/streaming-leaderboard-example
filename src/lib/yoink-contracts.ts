// Yoink contract addresses on Optimism Sepolia
export const YOINK_CONTRACTS = {
  MASTER: "0x78A6e6EF25914d5b5B794A0Bd534217115ce70AE",
  FACTORY: "0xB8bfc5f64a76C1ad1666c0ECd41Fd9faB5B75aD7",
  ESCROW_WRAPPER: "0x24Bac88D50b90981d646d7976cB8A73e89e407bB",
  ESCROW_PURE: "0x352eC9e0dB372a0E5b99ae046af837B5d5019d8A",
} as const;

// OpenYoinkAgent address - allows anyone to trigger yoinking
export const OPEN_YOINK_AGENT_ADDRESS = "0x72dBF8abC021F673de2b808E9424e11A7Fc4adc9";

// Shared Yoinking Configuration (from environment)
export const SHARED_YOINK_CONFIG = {
  ESCROW: (import.meta.env.VITE_SHARED_YOINK_ESCROW as string) || "",
  AGENT: (import.meta.env.VITE_SHARED_YOINK_AGENT as string) || "",
  YOINK_ID: parseInt((import.meta.env.VITE_SHARED_YOINK_ID as string) || "0", 10),
} as const;

// Check if shared yoinking is enabled
export const isSharedYoinkEnabled = () => {
  return !!(SHARED_YOINK_CONFIG.ESCROW && SHARED_YOINK_CONFIG.AGENT && SHARED_YOINK_CONFIG.YOINK_ID > 0);
};

// Import ABIs from the actual contract files
import { YoinkMasterAbi, YoinkFactory, OpenYoinkAgent, YoinkEscrow } from "../abis/yoinkmaster";

// Export the ABIs with consistent naming
export const YOINK_MASTER_ABI = YoinkMasterAbi;
export const YOINK_FACTORY_ABI = YoinkFactory;
export const OPEN_YOINK_AGENT_ABI = OpenYoinkAgent;
export const YOINK_ESCROW_ABI = YoinkEscrow;

// Yoink types
export interface YoinkDetails {
  admin: string;
  yoinkAgent: string; 
  streamAgent: string;
  token: string;
  streamToken: string;
  recipient: string;
  flowRate: string;
  isActive: boolean;
  hook: string;
  treasury?: string; // Escrow/treasury address
}

export interface CreateYoinkParams {
  admin: string;
  token: string;
  yoinkAgent: string;
  streamAgent: string;
  description: string;
  hook?: string;
}

export interface YoinkStats {
  totalYoinks: number;
  activeStreams: number;
  totalValueStreamed: string;
  totalFlowRate: string;
}

// Helper function to convert flow rate from per-second to per-day
export function formatYoinkFlowRate(rawPerSecond: string, fractionDigits = 6): string {
  const perSecond = Number(rawPerSecond) / 1e18; // Assuming 18 decimals
  if (!Number.isFinite(perSecond)) return "0";
  const perDay = perSecond * 86400;
  return perDay.toFixed(fractionDigits);
}

// Yoink type constants
export const YOINK_TYPES = {
  CUSTOM: "CUSTOM",
  WRAPPER: "WRAPPER", 
  SMART_FLOW_RATE: "SMART_FLOW_RATE",
  FEE_PULLER: "FEE_PULLER"
} as const;

export type YoinkType = typeof YOINK_TYPES[keyof typeof YOINK_TYPES];

// ERC20/SuperToken ABI for escrow management
export const ESCROW_TOKEN_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable"
  }
] as const;

// Use the escrow ABI for shared yoink management
export const SHARED_YOINK_ESCROW_ABI = YOINK_ESCROW_ABI;

// Legacy placeholder - keeping for compatibility
export const SHARED_YOINK_AGENT_ABI = OPEN_YOINK_AGENT_ABI;

// Shared Yoinking interfaces
export interface SharedYoinkStats {
  totalDeposited: string;
  totalYoinked: string;
  totalUsers: number;
  currentBalance: string;
  yoinkRate: string; // per second
}

export interface YoinkContributor {
  address: string;
  totalDeposited: string;
  totalYoinked: string;
  netContribution: string; // deposited - yoinked
}

export interface YoinkLeaderboard {
  topContributors: YoinkContributor[];
  topYoinkers: YoinkContributor[];
}
