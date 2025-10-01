import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { 
  YOINK_CONTRACTS, 
  YOINK_MASTER_ABI, 
  SHARED_YOINK_CONFIG,
  SHARED_YOINK_ESCROW_ABI,
  ESCROW_TOKEN_ABI,
  isSharedYoinkEnabled,
  OPEN_YOINK_AGENT_ADDRESS,
  type YoinkDetails, 
  type YoinkStats,
  type SharedYoinkStats
} from "../../lib/yoink-contracts";
import { TOKEN_ADDRESS, CHAIN_ID, SUPERFLUID_SUBGRAPH_BASE, TOKEN_SYMBOL } from "../../lib/superfluid";

// Only enable yoink functionality on Optimism Sepolia for now
const YOINK_ENABLED_CHAINS = [11155420]; // Optimism Sepolia

export function useIsYoinkEnabled() {
  return YOINK_ENABLED_CHAINS.includes(CHAIN_ID);
}

export function useYoinkDetails(yoinkId: number | undefined) {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();

  return useQuery({
    queryKey: ["yoink-details", yoinkId, CHAIN_ID],
    queryFn: async (): Promise<YoinkDetails | null> => {
      if (!publicClient || !yoinkId || !isEnabled) return null;

      try {
        const result = await publicClient.readContract({
          address: YOINK_CONTRACTS.MASTER as `0x${string}`,
          abi: YOINK_MASTER_ABI,
          functionName: "getYoink",
          args: [BigInt(yoinkId)],
        });

        const yoinkData = result as any;
        return {
          admin: yoinkData.admin as string,
          yoinkAgent: yoinkData.yoinkAgent as string,
          streamAgent: yoinkData.streamAgent as string,
          token: yoinkData.token as string,
          streamToken: yoinkData.token as string, // Same as token for this implementation
          recipient: yoinkData.currentRecipient as string,
          flowRate: (yoinkData.currentFlowRate as bigint).toString(),
          isActive: yoinkData.isActive as boolean,
          hook: yoinkData.hook as string,
          treasury: yoinkData.treasury as string,
        };
      } catch (error) {
        console.error("Error fetching yoink details:", error);
        return null;
      }
    },
    enabled: !!publicClient && !!yoinkId && isEnabled,
    staleTime: 30000, // 30 seconds
  });
}

export function useYoinkStats() {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();

  return useQuery({
    queryKey: ["yoink-stats", CHAIN_ID],
    queryFn: async (): Promise<YoinkStats | null> => {
      if (!publicClient || !isEnabled) return null;

      try {
        // Get total supply of yoinks
        const totalSupply = await publicClient.readContract({
          address: YOINK_CONTRACTS.MASTER as `0x${string}`,
          abi: YOINK_MASTER_ABI,
          functionName: "totalSupply",
          args: [],
        });

        // For now, return basic stats - can be enhanced with more contract calls
        return {
          totalYoinks: Number(totalSupply),
          activeStreams: 0, // TODO: Count active streams
          totalValueStreamed: "0", // TODO: Calculate from events
          totalFlowRate: "0", // TODO: Sum all active flow rates
        };
      } catch (error) {
        console.error("Error fetching yoink stats:", error);
        return {
          totalYoinks: 0,
          activeStreams: 0,
          totalValueStreamed: "0",
          totalFlowRate: "0",
        };
      }
    },
    enabled: !!publicClient && isEnabled,
    staleTime: 60000, // 1 minute
  });
}

export function useUserYoinks() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();

  return useQuery({
    queryKey: ["user-yoinks", address, CHAIN_ID],
    queryFn: async (): Promise<YoinkDetails[]> => {
      if (!publicClient || !address || !isEnabled) return [];

      try {
        // Get total supply first
        const totalSupply = await publicClient.readContract({
          address: YOINK_CONTRACTS.MASTER as `0x${string}`,
          abi: YOINK_MASTER_ABI,
          functionName: "totalSupply",
          args: [],
        });

        const userYoinks: YoinkDetails[] = [];

        // Check each yoink to see if user is admin
        for (let i = 1; i <= Number(totalSupply); i++) {
          try {
            const admin = await publicClient.readContract({
              address: YOINK_CONTRACTS.MASTER as `0x${string}`,
              abi: YOINK_MASTER_ABI,
              functionName: "getAdmin",
              args: [BigInt(i)],
            });

            if ((admin as string).toLowerCase() === address.toLowerCase()) {
              const details = await publicClient.readContract({
                address: YOINK_CONTRACTS.MASTER as `0x${string}`,
                abi: YOINK_MASTER_ABI,
                functionName: "getYoink",
                args: [BigInt(i)],
              });

              const yoinkData = details as any;
              userYoinks.push({
                admin: yoinkData.admin as string,
                yoinkAgent: yoinkData.yoinkAgent as string,
                streamAgent: yoinkData.streamAgent as string,
                token: yoinkData.token as string,
                streamToken: yoinkData.token as string, // Same as token for this implementation
                recipient: yoinkData.currentRecipient as string,
                flowRate: (yoinkData.currentFlowRate as bigint).toString(),
                isActive: yoinkData.isActive as boolean,
                hook: yoinkData.hook as string,
                treasury: yoinkData.treasury as string, // Add the treasury/escrow address
              });
            }
          } catch (err) {
            console.warn(`Error checking yoink ${i}:`, err);
          }
        }

        return userYoinks;
      } catch (error) {
        console.error("Error fetching user yoinks:", error);
        return [];
      }
    },
    enabled: !!publicClient && !!address && isEnabled,
    staleTime: 30000, // 30 seconds
  });
}

// Shared Yoinking Hooks
export function useSharedYoinkStats() {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["shared-yoink-stats", CHAIN_ID],
    queryFn: async (): Promise<SharedYoinkStats | null> => {
      if (!publicClient || !isEnabled || !isSharedEnabled) return null;

      try {
        // Get current balance from escrow
        const balance = await publicClient.readContract({
          address: SHARED_YOINK_CONFIG.ESCROW as `0x${string}`,
          abi: SHARED_YOINK_ESCROW_ABI,
          functionName: "getSuperTokenBalance",
          args: [],
        });

        // TODO: Get more detailed stats from events or additional contract calls
        return {
          totalDeposited: "0", // To be calculated from events
          totalYoinked: "0", // To be calculated from events  
          totalUsers: 0, // To be calculated from events
          currentBalance: (balance as bigint).toString(),
          yoinkRate: "0", // To be calculated from stream rate
        };
      } catch (error) {
        console.error("Error fetching shared yoink stats:", error);
        return {
          totalDeposited: "0",
          totalYoinked: "0",
          totalUsers: 0,
          currentBalance: "0",
          yoinkRate: "0",
        };
      }
    },
    enabled: !!publicClient && isEnabled && isSharedEnabled,
    staleTime: 30000, // 30 seconds
  });
}

export function useUserSharedYoinkBalance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["user-shared-yoink-balance", address, CHAIN_ID],
    queryFn: async (): Promise<string> => {
      if (!publicClient || !address || !isEnabled || !isSharedEnabled) return "0";

      try {
        const balance = await publicClient.readContract({
          address: SHARED_YOINK_CONFIG.ESCROW as `0x${string}`,
          abi: SHARED_YOINK_ESCROW_ABI,
          functionName: "getSuperTokenBalance",
          args: [],
        });

        return (balance as bigint).toString();
      } catch (error) {
        console.error("Error fetching user shared yoink balance:", error);
        return "0";
      }
    },
    enabled: !!publicClient && !!address && isEnabled && isSharedEnabled,
    staleTime: 15000, // 15 seconds for more frequent updates
  });
}

// For OpenYoinkAgent, anyone can yoink - no permission check needed
export function useCanUserYoink() {
  const { address } = useAccount();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["can-user-yoink", address, CHAIN_ID],
    queryFn: async (): Promise<boolean> => {
      // With OpenYoinkAgent, anyone can yoink for themselves
      return !!(address && isEnabled && isSharedEnabled);
    },
    enabled: !!address && isEnabled && isSharedEnabled,
    staleTime: 30000, // 30 seconds
  });
}

// Get the specific yoink details for the shared yoink
export function useSharedYoinkDetails() {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["shared-yoink-details", SHARED_YOINK_CONFIG.YOINK_ID, CHAIN_ID],
    queryFn: async (): Promise<YoinkDetails | null> => {
      if (!publicClient || !isEnabled || !isSharedEnabled) return null;

      try {
        const result = await publicClient.readContract({
          address: YOINK_CONTRACTS.MASTER as `0x${string}`,
          abi: YOINK_MASTER_ABI,
          functionName: "getYoink",
          args: [BigInt(SHARED_YOINK_CONFIG.YOINK_ID)],
        });

        const yoinkData = result as any;
        return {
          admin: yoinkData.admin as string,
          yoinkAgent: yoinkData.yoinkAgent as string,
          streamAgent: yoinkData.streamAgent as string,
          token: yoinkData.token as string,
          streamToken: yoinkData.token as string, // Same as token for this implementation
          recipient: yoinkData.currentRecipient as string,
          flowRate: (yoinkData.currentFlowRate as bigint).toString(),
          isActive: yoinkData.isActive as boolean,
          hook: yoinkData.hook as string,
          treasury: yoinkData.treasury as string,
        };
      } catch (error) {
        console.error("Error fetching shared yoink details:", error);
        return null;
      }
    },
    enabled: !!publicClient && isEnabled && isSharedEnabled && SHARED_YOINK_CONFIG.YOINK_ID > 0,
    staleTime: 60000, // 1 minute
  });
}

// Escrow management hooks
export function useEscrowBalance() {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["escrow-balance", SHARED_YOINK_CONFIG.ESCROW, CHAIN_ID],
    queryFn: async (): Promise<string> => {
      if (!publicClient || !isEnabled || !isSharedEnabled) return "0";

      try {
        // Get token balance of the escrow contract
        const balance = await publicClient.readContract({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: ESCROW_TOKEN_ABI,
          functionName: "balanceOf",
          args: [SHARED_YOINK_CONFIG.ESCROW as `0x${string}`],
        });

        return (balance as bigint).toString();
      } catch (error) {
        console.error("Error fetching escrow balance:", error);
        return "0";
      }
    },
    enabled: !!publicClient && isEnabled && isSharedEnabled,
    staleTime: 15000, // 15 seconds for frequent updates
  });
}

export function useEscrowDistributionRate() {
  const sharedYoinkDetails = useSharedYoinkDetails();
  
  return {
    data: sharedYoinkDetails.data?.isActive 
      ? (Number(sharedYoinkDetails.data.flowRate) / 10**18 * 86400).toFixed(6)
      : "0",
    isLoading: sharedYoinkDetails.isLoading,
  };
}

// Hook to get escrow balance for a specific yoink
export function useYoinkEscrowBalance(yoinkId: number | undefined, treasuryAddress?: string, tokenAddress?: string) {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();

  return useQuery({
    queryKey: ["yoink-escrow-balance", yoinkId, treasuryAddress, tokenAddress, CHAIN_ID],
    queryFn: async (): Promise<string> => {
      if (!publicClient || !isEnabled) return "0";

      try {
        let treasury = treasuryAddress;
        let token = tokenAddress;

        // If we don't have treasury and token addresses, get them from yoink data
        if (!treasury || !token) {
          if (!yoinkId) return "0";
          
          const yoinkData = await publicClient.readContract({
            address: YOINK_CONTRACTS.MASTER as `0x${string}`,
            abi: YOINK_MASTER_ABI,
            functionName: "getYoink",
            args: [BigInt(yoinkId)],
          });

          treasury = (yoinkData as any).treasury as string;
          token = (yoinkData as any).token as string;
        }

        if (!treasury || !token) return "0";

        // Get the token balance of the treasury/escrow
        const balance = await publicClient.readContract({
          address: token as `0x${string}`,
          abi: ESCROW_TOKEN_ABI,
          functionName: "balanceOf",
          args: [treasury as `0x${string}`],
        });

        return (balance as bigint).toString();
      } catch (error) {
        console.error("Error fetching yoink escrow balance:", error);
        return "0";
      }
    },
    enabled: !!publicClient && isEnabled && (!!yoinkId || (!!treasuryAddress && !!tokenAddress)),
    staleTime: 15000, // 15 seconds for frequent updates
  });
}

// Hook to get yoink distribution statistics
export function useYoinkDistributionStats(yoinkId: number | undefined, treasuryAddress?: string, tokenAddress?: string) {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();

  return useQuery({
    queryKey: ["yoink-distribution-stats", yoinkId, treasuryAddress, tokenAddress, CHAIN_ID],
    queryFn: async (): Promise<{
      totalDistributed: string;
      totalDeposited: string;
      currentBalance: string;
      distributionRate: string;
      timeRemaining: string;
    }> => {
      if (!publicClient || !isEnabled) {
        return {
          totalDistributed: "0",
          totalDeposited: "0", 
          currentBalance: "0",
          distributionRate: "0",
          timeRemaining: "0"
        };
      }

      try {
        let treasury = treasuryAddress;
        let token = tokenAddress;
        let flowRate = "0";

        // If we don't have treasury and token addresses, get them from yoink data
        if (!treasury || !token) {
          if (!yoinkId) {
            return {
              totalDistributed: "0",
              totalDeposited: "0",
              currentBalance: "0", 
              distributionRate: "0",
              timeRemaining: "0"
            };
          }
          
          const yoinkData = await publicClient.readContract({
            address: YOINK_CONTRACTS.MASTER as `0x${string}`,
            abi: YOINK_MASTER_ABI,
            functionName: "getYoink",
            args: [BigInt(yoinkId)],
          });

          treasury = (yoinkData as any).treasury as string;
          token = (yoinkData as any).token as string;
          flowRate = (yoinkData as any).currentFlowRate.toString();
        }

        if (!treasury || !token) {
          return {
            totalDistributed: "0",
            totalDeposited: "0",
            currentBalance: "0",
            distributionRate: "0", 
            timeRemaining: "0"
          };
        }

        // Get current escrow balance
        const currentBalance = await publicClient.readContract({
          address: token as `0x${string}`,
          abi: ESCROW_TOKEN_ABI,
          functionName: "balanceOf",
          args: [treasury as `0x${string}`],
        });

        const balanceWei = currentBalance as bigint;
        const flowRateWei = BigInt(flowRate);

        // Calculate total distributed by looking at YoinkForwarded events
        let totalDistributedWei = BigInt(0);
        
        try {
          // Get YoinkForwarded events from OpenYoinkAgent for this specific yoink
          const events = await publicClient.getLogs({
            address: OPEN_YOINK_AGENT_ADDRESS as `0x${string}`,
            event: {
              type: "event",
              name: "YoinkForwarded",
              inputs: [
                { indexed: true, name: "yoinkId", type: "uint256" },
                { indexed: true, name: "newRecipient", type: "address" },
                { indexed: true, name: "caller", type: "address" }
              ]
            },
            fromBlock: "earliest",
            toBlock: "latest",
            args: {
              yoinkId: yoinkId ? BigInt(yoinkId) : undefined
            }
          });

          // Calculate distributed amount based on time between events and flow rate
          if (events.length > 0 && flowRateWei > 0) {
            // Sort events by block number to get chronological order
            const sortedEvents = events.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
            
            // Get the first and last event timestamps
            const firstEvent = sortedEvents[0];
            const lastEvent = sortedEvents[sortedEvents.length - 1];
            
            // Get block timestamps
            const firstBlock = await publicClient.getBlock({ blockNumber: firstEvent.blockNumber });
            const lastBlock = await publicClient.getBlock({ blockNumber: lastEvent.blockNumber });
            
            // Calculate total time span in seconds
            const timeSpan = Number(lastBlock.timestamp) - Number(firstBlock.timestamp);
            
            // Estimate distributed amount based on flow rate and time span
            // This is still an approximation, but better than per-event estimation
            totalDistributedWei = (flowRateWei * BigInt(Math.floor(timeSpan))) / BigInt(1);
          }
        } catch (error) {
          console.warn("Could not fetch distribution events:", error);
          // Fallback: if we can't get events, estimate based on current time and flow rate
          // This is a very rough estimate
          if (flowRateWei > 0) {
            // Assume the yoink has been running for some time (this is just a placeholder)
            // In a real implementation, you'd want to track the actual start time
            const estimatedRuntime = BigInt(86400); // 1 day as placeholder
            totalDistributedWei = (flowRateWei * estimatedRuntime) / BigInt(1);
          }
        }

        const totalDepositedWei = balanceWei + totalDistributedWei;
        
        // Calculate time remaining (in seconds)
        const timeRemaining = flowRateWei > 0 ? balanceWei / flowRateWei : BigInt(0);

        return {
          totalDistributed: totalDistributedWei.toString(),
          totalDeposited: totalDepositedWei.toString(),
          currentBalance: balanceWei.toString(),
          distributionRate: flowRateWei.toString(),
          timeRemaining: timeRemaining.toString()
        };
      } catch (error) {
        console.error("Error fetching yoink distribution stats:", error);
        return {
          totalDistributed: "0",
          totalDeposited: "0",
          currentBalance: "0",
          distributionRate: "0",
          timeRemaining: "0"
        };
      }
    },
    enabled: !!publicClient && isEnabled && (!!yoinkId || (!!treasuryAddress && !!tokenAddress)),
    staleTime: 30000, // 30 seconds for stats updates
  });
}

// Leaderboard from OpenYoinkAgent logs (YoinkForwarded events)
export function useYoinkLeaderboard() {
  const publicClient = usePublicClient();
  const isEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();

  return useQuery({
    queryKey: ["yoink-leaderboard", SHARED_YOINK_CONFIG.YOINK_ID, CHAIN_ID],
    queryFn: async (): Promise<{ 
      address: string; 
      totalYoinked: string;
      totalReceived: string;
      lastYoinkTime: number;
      isCurrentlyReceiving: boolean;
      currentFlowRate: string;
    }[]> => {
      if (!publicClient || !isEnabled || !isSharedEnabled) return [];

      try {
        // Get current yoink details to check current recipient and flow rate
        const yoinkDetails = await publicClient.readContract({
          address: YOINK_CONTRACTS.MASTER as `0x${string}`,
          abi: YOINK_MASTER_ABI,
          functionName: "getYoink",
          args: [BigInt(SHARED_YOINK_CONFIG.YOINK_ID)],
        });

        const currentRecipient = (yoinkDetails as any).currentRecipient as string;
        const currentFlowRate = (yoinkDetails as any).currentFlowRate as bigint;
        const escrowAddress = (yoinkDetails as any).treasury as string;
        const tokenAddress = (yoinkDetails as any).token as string;

        if (!escrowAddress || !tokenAddress) {
          console.warn("No escrow or token address found for shared yoink");
          return [];
        }

        // Query FlowUpdatedEvent entities from Superfluid subgraph
        const query = `
          query GetYoinkFlowEvents($escrowAddress: String!, $tokenAddress: String!) {
            flowUpdatedEvents(
              where: {
                sender: $escrowAddress,
                token: $tokenAddress
              }
              orderBy: timestamp
              orderDirection: desc
              first: 1000
            ) {
              id
              timestamp
              receiver
              flowRate
              totalAmountStreamedUntilTimestamp
              blockNumber
              transactionHash
            }
          }
        `;

        const response = await fetch(SUPERFLUID_SUBGRAPH_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              escrowAddress: escrowAddress.toLowerCase(),
              tokenAddress: tokenAddress.toLowerCase(),
            },
          }),
        });

        const data = await response.json();
        
        if (!data.data?.flowUpdatedEvents) {
          console.warn("No flow events found in subgraph");
          return [];
        }

        const flowEvents = data.data.flowUpdatedEvents;

        // Process flow events to build leaderboard
        const addressStats: Record<string, {
          yoinkCount: number;
          totalReceived: bigint;
          lastYoinkTime: number;
          isCurrentlyReceiving: boolean;
          currentFlowRate: string;
        }> = {};

        // Track flow changes to identify yoinks
        const flowChanges: Array<{
          receiver: string;
          timestamp: number;
          flowRate: string;
          totalStreamed: string;
        }> = [];

        for (const event of flowEvents) {
          const receiver = event.receiver.toLowerCase();
          const timestamp = parseInt(event.timestamp) * 1000; // Convert to milliseconds
          const flowRate = BigInt(event.flowRate);
          const totalStreamed = BigInt(event.totalAmountStreamedUntilTimestamp);

          // Only count events where flow rate changed (not just updates to total streamed)
          if (flowRate > 0) {
            flowChanges.push({
              receiver,
              timestamp,
              flowRate: event.flowRate,
              totalStreamed: event.totalAmountStreamedUntilTimestamp,
            });
          }

          if (!addressStats[receiver]) {
            addressStats[receiver] = {
              yoinkCount: 0,
              totalReceived: BigInt(0),
              lastYoinkTime: 0,
              isCurrentlyReceiving: false,
              currentFlowRate: "0",
            };
          }

          // Update last yoink time
          addressStats[receiver].lastYoinkTime = Math.max(addressStats[receiver].lastYoinkTime, timestamp);
          
          // If this address is currently receiving, mark it
          if (receiver === currentRecipient.toLowerCase()) {
            addressStats[receiver].isCurrentlyReceiving = true;
            addressStats[receiver].currentFlowRate = event.flowRate;
          }
        }

        // Count yoinks by counting flow rate changes to each address
        for (const change of flowChanges) {
          addressStats[change.receiver].yoinkCount += 1;
        }

        // Calculate total received amounts
        for (const addr in addressStats) {
          const stats = addressStats[addr];
          
          if (stats.isCurrentlyReceiving && currentFlowRate > 0) {
            // If currently receiving, estimate based on current flow rate and time since last yoink
            const now = Date.now();
            const timeSinceLastYoink = (now - stats.lastYoinkTime) / 1000; // Convert to seconds
            const estimatedReceived = (currentFlowRate * BigInt(Math.floor(timeSinceLastYoink))) / BigInt(1);
            stats.totalReceived = estimatedReceived;
          } else {
            // For past recipients, estimate based on average flow rate
            // This is a rough approximation - in a real implementation you'd track this more precisely
            const estimatedReceived = (currentFlowRate * BigInt(3600)) / BigInt(1); // 1 hour estimate
            stats.totalReceived = estimatedReceived;
          }
        }

        const entries = Object.entries(addressStats)
          .map(([address, stats]) => ({
            address,
            totalYoinked: String(stats.yoinkCount),
            totalReceived: stats.totalReceived.toString(),
            lastYoinkTime: stats.lastYoinkTime,
            isCurrentlyReceiving: stats.isCurrentlyReceiving,
            currentFlowRate: stats.currentFlowRate,
          }))
          .sort((a, b) => Number(b.totalYoinked) - Number(a.totalYoinked))
          .slice(0, 20);

        return entries;
      } catch (error) {
        console.error("Error fetching yoink leaderboard:", error);
        return [];
      }
    },
    enabled: !!publicClient && isEnabled && isSharedEnabled && SHARED_YOINK_CONFIG.YOINK_ID > 0,
    staleTime: 30000,
  });
}
