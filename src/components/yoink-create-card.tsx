import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "./ui/button";
import { useIsYoinkEnabled, useCanUserYoink, useSharedYoinkDetails } from "../hooks/queries/use-yoink-data";
import { 
  YOINK_CONTRACTS, 
  YOINK_FACTORY_ABI,
  YOINK_MASTER_ABI,
  YOINK_TYPES, 
  SHARED_YOINK_CONFIG,
  OPEN_YOINK_AGENT_ABI,
  OPEN_YOINK_AGENT_ADDRESS,
  isSharedYoinkEnabled,
  type YoinkType 
} from "../lib/yoink-contracts";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "../lib/superfluid";

interface YoinkCreateCardProps {
  className?: string;
}

export function YoinkCreateCard({ className = "" }: YoinkCreateCardProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const isYoinkEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();
  
  // Shared yoinking data
  const { data: sharedYoinkDetails } = useSharedYoinkDetails();
  const { data: canYoink } = useCanUserYoink();
  
  const [yoinkType, setYoinkType] = useState<YoinkType>(YOINK_TYPES.CUSTOM);
  const [formData, setFormData] = useState({
    yoinkAgent: "",
    streamAgent: "",
    description: "",
    hook: "",
    underlyingToken: "",
    superToken: TOKEN_ADDRESS,
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // Shared yoinking state
  const [isYoinking, setIsYoinking] = useState(false);
  
  // Rate-limited yoink creation state
  const [isCreatingRateLimited, setIsCreatingRateLimited] = useState(false);
  const [createdYoinkInfo, setCreatedYoinkInfo] = useState<{
    yoinkId: string;
    escrowAddress: string;
    txHash: string;
  } | null>(null);

  if (!isYoinkEnabled) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">CREATE YOINK</h2>
        <div className="text-center">
          <p className="theme-text-secondary">
            Yoink is only available on Optimism Sepolia testnet.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !walletClient) {
      alert("Please connect your wallet");
      return;
    }

    setIsCreating(true);
    
    try {
      const baseParams = {
        admin: address,
        yoinkAgent: formData.yoinkAgent,
        streamAgent: formData.streamAgent,
        description: formData.description,
        hook: formData.hook || "0x0000000000000000000000000000000000000000",
      };

      let functionName: string;
      let args: unknown[];

      switch (yoinkType) {
        case YOINK_TYPES.WRAPPER:
          functionName = "createWrapperYoink";
          args = [
            baseParams.admin,
            baseParams.yoinkAgent,
            baseParams.streamAgent,
            baseParams.description,
            formData.underlyingToken,
            formData.superToken,
            baseParams.hook,
          ];
          break;
        case YOINK_TYPES.SMART_FLOW_RATE:
          functionName = "createSmartFlowRateYoink";
          args = [
            baseParams.admin,
            baseParams.yoinkAgent,
            formData.superToken,
            baseParams.description,
            baseParams.hook,
          ];
          break;
        case YOINK_TYPES.FEE_PULLER:
          functionName = "createFeePullerYoink";
          args = [
            baseParams.admin,
            baseParams.yoinkAgent,
            baseParams.streamAgent,
            formData.superToken,
            baseParams.description,
            baseParams.hook,
          ];
          break;
        default: // CUSTOM
          functionName = "createCustomYoink";
          args = [
            baseParams.admin,
            baseParams.yoinkAgent,
            baseParams.streamAgent,
            formData.superToken,
            baseParams.description,
            baseParams.hook,
          ];
      }

      const hash = await walletClient.writeContract({
        address: YOINK_CONTRACTS.FACTORY as `0x${string}`,
        abi: YOINK_FACTORY_ABI,
        functionName: functionName as any,
        args: args as any,
      });

      console.log("Yoink creation transaction:", hash);
      
      // Reset form
      setFormData({
        yoinkAgent: "",
        streamAgent: "",
        description: "",
        hook: "",
        underlyingToken: "",
        superToken: TOKEN_ADDRESS,
      });
      
      alert("Yoink creation transaction submitted! Check your wallet for status.");
    } catch (error) {
      console.error("Error creating yoink:", error);
      alert("Failed to create yoink. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleYoinkToSelf = async () => {
    if (!address || !walletClient) {
      alert("Please connect your wallet");
      return;
    }

    if (!canYoink) {
      alert("Yoinking is not available right now");
      return;
    }

    setIsYoinking(true);
    
    try {
      // Call OpenYoinkAgent.yoinkForAnyone() with user's address as recipient
      const hash = await walletClient.writeContract({
        address: SHARED_YOINK_CONFIG.AGENT as `0x${string}`,
        abi: OPEN_YOINK_AGENT_ABI,
        functionName: "yoinkForAnyone",
        args: [BigInt(SHARED_YOINK_CONFIG.YOINK_ID), address],
      });

      console.log("Yoink-to-self transaction:", hash);
      alert("Yoink transaction submitted! Check your wallet for status.");
    } catch (error) {
      console.error("Error yoinking to self:", error);
      alert("Failed to yoink. Check console for details.");
    } finally {
      setIsYoinking(false);
    }
  };

  const handleCreateRateLimitedYoink = async () => {
    if (!address || !walletClient || !publicClient) {
      alert("Please connect your wallet");
      return;
    }

    setIsCreatingRateLimited(true);
    
    try {
      // Create a rate-limited yoink using the smart flow rate type
      const hash = await walletClient.writeContract({
        address: YOINK_CONTRACTS.FACTORY as `0x${string}`,
        abi: YOINK_FACTORY_ABI,
        functionName: "createSmartFlowRateYoink",
        args: [
          address, // admin (user's address)
          OPEN_YOINK_AGENT_ADDRESS, // yoinkAgent (OpenYoinkAgent)
          TOKEN_ADDRESS, // token (app's token)
          "https://example.com/metadata", // metadataURI (fake URL as requested)
          BigInt(86400), // targetDuration (1 day in seconds)
        ],
      });

      console.log("Rate-limited yoink creation transaction:", hash);
      
      // Wait for transaction receipt to get the results
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Extract yoink ID and escrow address from events/logs
      let yoinkId = "Unknown";
      let escrowAddress = "Unknown";
      
      // Look for YoinkCreated event in the logs
      if (receipt.logs && receipt.logs.length > 0) {
        console.log("Transaction receipt:", receipt);
        
        // Parse the YoinkCreated event from the factory
        for (const log of receipt.logs) {
          try {
            const decoded = (publicClient as any).decodeEventLog({
              abi: YOINK_FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            
            if (decoded.eventName === "YoinkCreated") {
              yoinkId = (decoded.args.yoinkId as bigint).toString();
              escrowAddress = decoded.args.escrowContract as string;
              break;
            }
          } catch (err) {
            // Try parsing as YoinkMaster YoinkCreated event
            try {
              const decoded = (publicClient as any).decodeEventLog({
                abi: YOINK_MASTER_ABI,
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === "YoinkCreated") {
                yoinkId = (decoded.args.yoinkId as bigint).toString();
                // For YoinkMaster events, we need to get the treasury/escrow from the yoink data
                if (yoinkId !== "Unknown") {
                  try {
                    const yoinkData = await publicClient.readContract({
                      address: YOINK_CONTRACTS.MASTER as `0x${string}`,
                      abi: YOINK_MASTER_ABI,
                      functionName: "getYoink",
                      args: [BigInt(yoinkId)],
                    });
                    escrowAddress = (yoinkData as any).treasury as string;
                  } catch (treasuryErr) {
                    console.warn("Could not fetch treasury address:", treasuryErr);
                  }
                }
                break;
              }
            } catch (masterErr) {
              // Not a YoinkMaster event either, continue
            }
          }
        }
        
        // Fallback: try to get yoink ID from totalSupply if event parsing failed
        if (yoinkId === "Unknown") {
          try {
            const totalSupply = await publicClient.readContract({
              address: YOINK_CONTRACTS.MASTER as `0x${string}`,
              abi: YOINK_MASTER_ABI,
              functionName: "totalSupply",
              args: [],
            });
            yoinkId = (totalSupply as bigint).toString();
          } catch (err) {
            console.warn("Could not fetch yoink ID:", err);
          }
        }
        
        if (escrowAddress === "Unknown") {
          escrowAddress = "Check transaction on explorer";
        }
      }
      
      setCreatedYoinkInfo({
        yoinkId,
        escrowAddress,
        txHash: hash,
      });
      
    } catch (error) {
      console.error("Error creating rate-limited yoink:", error);
      alert("Failed to create rate-limited yoink. Check console for details.");
    } finally {
      setIsCreatingRateLimited(false);
    }
  };

  // Show free-for-all yoinking interface if enabled
  if (isSharedEnabled) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">FREE-FOR-ALL YOINK</h2>
        
        {/* Yoink Details Display */}
        {sharedYoinkDetails && (
          <div className="space-y-3 mb-6">
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Yoink ID</div>
              <div className="theme-text-primary font-bold text-lg">#{SHARED_YOINK_CONFIG.YOINK_ID}</div>
            </div>
            
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Status</div>
              <div className={`font-bold text-lg ${sharedYoinkDetails.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {sharedYoinkDetails.isActive ? "Active" : "Inactive"}
              </div>
            </div>
            
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Current Recipient</div>
              <div className="theme-text-primary font-mono text-sm">
                {sharedYoinkDetails.recipient === "0x0000000000000000000000000000000000000000" 
                  ? "No recipient set" 
                  : `${sharedYoinkDetails.recipient.slice(0, 6)}...${sharedYoinkDetails.recipient.slice(-4)}`
                }
              </div>
            </div>
            
            {sharedYoinkDetails.isActive && (
              <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
                <div className="theme-text-secondary text-sm">Flow Rate</div>
                <div className="theme-text-primary font-bold text-lg">
                  {(Number(sharedYoinkDetails.flowRate) / 10**18 * 86400).toFixed(6)} {TOKEN_SYMBOL}/day
                </div>
              </div>
            )}
          </div>
        )}

        {/* Yoink-to-Self Action */}
        {canYoink && sharedYoinkDetails?.isActive && (
          <div className="space-y-4">
            <h3 className="font-bold theme-text-primary">Yoink to Yourself</h3>
            <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm mb-2">
                Click to yoink the stream to your address:
              </div>
              <div className="theme-text-primary font-mono text-sm mb-4">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <Button
                onClick={handleYoinkToSelf}
                disabled={isYoinking || !address}
                className="w-full theme-button text-black font-bold"
              >
                {isYoinking ? "Yoinking..." : "YOINK TO MYSELF!"}
              </Button>
            </div>
          </div>
        )}

        {!canYoink && (
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm text-center">
              Connect your wallet to participate in free-for-all yoinking
            </div>
          </div>
        )}

        {!sharedYoinkDetails?.isActive && sharedYoinkDetails && (
          <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm text-center">
              This yoink is currently inactive
            </div>
          </div>
        )}

        <div className="text-xs theme-text-muted mt-4">
          * Free-for-all yoinking on Optimism Sepolia
        </div>
      </div>
    );
  }

  // Show individual yoink creation interface
  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">CREATE YOINK</h2>

      {/* Created Yoink Info Display */}
      {createdYoinkInfo && (
        <div className="space-y-4 mb-6">
          <h3 className="font-bold theme-text-primary text-green-400">✅ Yoink Created Successfully!</h3>
          <div className="space-y-3">
            <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Transaction Hash</div>
              <div className="flex items-center justify-between">
                <div className="theme-text-primary font-mono text-sm">
                  {createdYoinkInfo.txHash.slice(0, 10)}...{createdYoinkInfo.txHash.slice(-8)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(createdYoinkInfo.txHash)}
                    className="theme-text-secondary hover:theme-text-primary text-xs px-2 py-1 border theme-border rounded"
                    style={{borderWidth: '1px'}}
                  >
                    Copy
                  </button>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${createdYoinkInfo.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="theme-text-secondary hover:theme-text-primary text-xs px-2 py-1 border theme-border rounded no-underline"
                    style={{borderWidth: '1px'}}
                  >
                    View
                  </a>
                </div>
              </div>
            </div>
            
            <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Yoink ID</div>
              <div className="flex items-center justify-between">
                <div className="theme-text-primary font-bold text-lg">{createdYoinkInfo.yoinkId}</div>
                <button
                  onClick={() => navigator.clipboard.writeText(createdYoinkInfo.yoinkId)}
                  className="theme-text-secondary hover:theme-text-primary text-xs px-2 py-1 border theme-border rounded"
                  style={{borderWidth: '1px'}}
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Escrow Contract</div>
              <div className="flex items-center justify-between">
                <div className="theme-text-primary font-mono text-sm">
                  {createdYoinkInfo.escrowAddress.slice(0, 8)}...{createdYoinkInfo.escrowAddress.slice(-6)}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(createdYoinkInfo.escrowAddress)}
                  className="theme-text-secondary hover:theme-text-primary text-xs px-2 py-1 border theme-border rounded"
                  style={{borderWidth: '1px'}}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="theme-card-bg rounded p-3 border theme-border bg-green-900/20" style={{borderWidth: '1px'}}>
              <div className="text-green-400 text-sm font-medium mb-1">Next Steps:</div>
              <ul className="text-green-300 text-xs space-y-1">
                <li>1. Fund your yoink by sending {TOKEN_SYMBOL} to the escrow</li>
                <li>2. Start streaming to begin the free-for-all</li>
                <li>3. Anyone can yoink using the OpenYoinkAgent!</li>
              </ul>
            </div>

            <button
              onClick={() => setCreatedYoinkInfo(null)}
              className="w-full theme-text-secondary hover:theme-text-primary text-sm py-2 border theme-border rounded"
              style={{borderWidth: '1px'}}
            >
              Create Another Yoink
            </button>
          </div>
        </div>
      )}

      {/* Quick Rate-Limited Yoink Creation */}
      {!createdYoinkInfo && (
        <div className="space-y-4 mb-6">
          <h3 className="font-bold theme-text-primary">Quick Setup</h3>
          <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
            <div className="theme-text-secondary text-sm mb-2">
              Create a rate-limited yoink that anyone can redirect:
            </div>
            <ul className="text-xs theme-text-secondary mb-4 space-y-1">
              <li>• Uses OpenYoinkAgent (anyone can yoink)</li>
              <li>• Rate-limited for fair access</li>
              <li>• Uses {TOKEN_SYMBOL} token</li>
              <li>• You control the funding</li>
            </ul>
            <Button
              onClick={handleCreateRateLimitedYoink}
              disabled={isCreatingRateLimited || !address}
              className="w-full theme-button text-black font-bold"
            >
              {isCreatingRateLimited ? "Creating..." : "CREATE RATE-LIMITED YOINK"}
            </Button>
          </div>
        </div>
      )}

      {/* Advanced Custom Creation */}
      <details className="space-y-4">
        <summary className="font-bold theme-text-primary cursor-pointer">Advanced Custom Setup</summary>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block theme-text-secondary text-sm font-medium mb-2">
              Yoink Type
            </label>
            <select
              value={yoinkType}
              onChange={(e) => setYoinkType(e.target.value as YoinkType)}
              className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{borderWidth: '1px'}}
            >
              <option value={YOINK_TYPES.CUSTOM}>Custom</option>
              <option value={YOINK_TYPES.WRAPPER}>Wrapper</option>
              <option value={YOINK_TYPES.SMART_FLOW_RATE}>Smart Flow Rate</option>
              <option value={YOINK_TYPES.FEE_PULLER}>Fee Puller</option>
            </select>
          </div>

        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Yoink Agent Address
          </label>
          <input
            type="text"
            value={formData.yoinkAgent}
            onChange={(e) => setFormData({ ...formData, yoinkAgent: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
            required
          />
        </div>

        {(yoinkType === YOINK_TYPES.CUSTOM || yoinkType === YOINK_TYPES.WRAPPER || yoinkType === YOINK_TYPES.FEE_PULLER) && (
          <div>
            <label className="block theme-text-secondary text-sm font-medium mb-2">
              Stream Agent Address
            </label>
            <input
              type="text"
              value={formData.streamAgent}
              onChange={(e) => setFormData({ ...formData, streamAgent: e.target.value })}
              placeholder="0x..."
              className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{borderWidth: '1px'}}
              required
            />
          </div>
        )}

        {yoinkType === YOINK_TYPES.WRAPPER && (
          <div>
            <label className="block theme-text-secondary text-sm font-medium mb-2">
              Underlying Token Address
            </label>
            <input
              type="text"
              value={formData.underlyingToken}
              onChange={(e) => setFormData({ ...formData, underlyingToken: e.target.value })}
              placeholder="0x..."
              className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{borderWidth: '1px'}}
              required
            />
          </div>
        )}

        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Super Token Address
          </label>
          <input
            type="text"
            value={formData.superToken}
            onChange={(e) => setFormData({ ...formData, superToken: e.target.value })}
            placeholder={`Default: ${TOKEN_SYMBOL}`}
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
            required
          />
        </div>

        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your yoink..."
            rows={3}
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
            required
          />
        </div>

        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Hook Address (Optional)
          </label>
          <input
            type="text"
            value={formData.hook}
            onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
            placeholder="0x... (optional)"
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
          />
        </div>

        <Button 
          type="submit"
          disabled={isCreating || !address}
          className="w-full theme-button text-black font-bold"
        >
          {isCreating ? "Creating..." : "CREATE YOINK"}
        </Button>
        </form>
      </details>

      <div className="text-xs theme-text-muted mt-4">
        * Read more about custom yoink creation here: <a href="https://github.com/kobuta23/everything-is-yoink" target="_blank" rel="noopener noreferrer" className="no-underline theme-text-secondary hover:theme-text-primary">https://github.com/kobuta23/everything-is-yoink</a>
      </div>
    </div>
  );
}
