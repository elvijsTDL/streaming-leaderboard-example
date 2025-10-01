import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useYoinkDistributionStats } from "../hooks/queries/use-yoink-data";
import { YoinkDetails } from "../lib/yoink-contracts";
import { TOKEN_SYMBOL } from "../lib/superfluid";
import { shortenAddress } from "../lib/utils";
import { Button } from "./ui/button";

interface YoinkItemProps {
  yoink: YoinkDetails;
  index: number;
}

export function YoinkItem({ yoink, index }: YoinkItemProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  // Removed unused escrowBalance hook since we're using distributionStats now
  const { data: distributionStats } = useYoinkDistributionStats(
    undefined,
    yoink.treasury,
    yoink.token
  );

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };


  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !walletClient || !depositAmount || !yoink.treasury || !yoink.token) {
      alert("Please connect your wallet and enter an amount");
      return;
    }

    setIsDepositing(true);
    
    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(depositAmount) * 10**18));
      
      // First check if user has enough balance
      const userBalance = await publicClient.readContract({
        address: yoink.token as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "balanceOf",
            "inputs": [{ "name": "account", "type": "address" }],
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view"
          }
        ],
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      if ((userBalance as bigint) < amountWei) {
        alert("Insufficient token balance");
        setIsDepositing(false);
        return;
      }

      // Transfer tokens to the yoink's escrow/treasury
      const hash = await walletClient.writeContract({
        address: yoink.token as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "transfer",
            "inputs": [
              { "name": "to", "type": "address" },
              { "name": "amount", "type": "uint256" }
            ],
            "outputs": [{ "name": "", "type": "bool" }],
            "stateMutability": "nonpayable"
          }
        ],
        functionName: "transfer",
        args: [yoink.treasury as `0x${string}`, amountWei],
      });

      console.log("Deposit transaction submitted:", hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash,
        timeout: 60000, // 60 seconds timeout
      });

      if (receipt.status === "success") {
        console.log("Deposit successful:", receipt);
        setDepositAmount("");
        alert(`Successfully deposited ${depositAmount} ${TOKEN_SYMBOL} to yoink escrow!`);
      } else {
        alert("Deposit transaction failed");
      }
    } catch (error) {
      console.error("Error depositing to yoink:", error);
      alert(`Failed to deposit: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !walletClient || !withdrawAmount || !yoink.treasury || !yoink.token) {
      alert("Please connect your wallet and enter an amount");
      return;
    }

    setIsWithdrawing(true);
    
    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 10**18));
      
      // First check if escrow has enough balance
      const escrowBalance = await publicClient.readContract({
        address: yoink.token as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "balanceOf",
            "inputs": [{ "name": "account", "type": "address" }],
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view"
          }
        ],
        functionName: "balanceOf",
        args: [yoink.treasury as `0x${string}`],
      });

      if ((escrowBalance as bigint) < amountWei) {
        alert("Insufficient escrow balance");
        setIsWithdrawing(false);
        return;
      }

      // Transfer tokens from escrow to user
      const hash = await walletClient.writeContract({
        address: yoink.token as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "transfer",
            "inputs": [
              { "name": "to", "type": "address" },
              { "name": "amount", "type": "uint256" }
            ],
            "outputs": [{ "name": "", "type": "bool" }],
            "stateMutability": "nonpayable"
          }
        ],
        functionName: "transfer",
        args: [address as `0x${string}`, amountWei],
      });

      console.log("Withdraw transaction submitted:", hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash,
        timeout: 60000, // 60 seconds timeout
      });

      if (receipt.status === "success") {
        console.log("Withdraw successful:", receipt);
        setWithdrawAmount("");
        alert(`Successfully withdrew ${withdrawAmount} ${TOKEN_SYMBOL} from yoink escrow!`);
      } else {
        alert("Withdraw transaction failed");
      }
    } catch (error) {
      console.error("Error withdrawing from yoink:", error);
      alert(`Failed to withdraw: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="theme-card-bg rounded p-4 border theme-border" style={{borderWidth: '1px'}}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-bold theme-text-primary mb-3">Yoink #{index + 1}</div>
          
          {/* First row: Status and Contract Address */}
          <div className="flex items-center gap-6 mb-3">
            <div>
              <div className="text-sm theme-text-secondary">Status</div>
              <div className={`font-medium ${yoink.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {yoink.isActive ? "Active" : "Inactive"}
              </div>
            </div>
            
            {yoink.treasury && (
              <div>
                <div className="text-sm theme-text-secondary">Contract Address</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm theme-text-primary">
                    {shortenAddress(yoink.treasury)}
                  </div>
                  <button
                    onClick={() => handleCopyAddress(yoink.treasury!)}
                    className="theme-text-secondary hover:theme-text-primary text-xs px-2 py-1 border theme-border rounded"
                    style={{borderWidth: '1px'}}
                    title="Copy escrow address"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Second row: Current Balance, Flow Rate, and Current Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm theme-text-secondary">Current Balance</div>
              <div className="font-medium theme-text-primary">
                {distributionStats ? 
                  `${(Number(distributionStats.currentBalance) / 10**18).toFixed(4)} ${TOKEN_SYMBOL}` : 
                  "Loading..."
                }
              </div>
            </div>
            
            <div>
              <div className="text-sm theme-text-secondary">Flow Rate</div>
              <div className="font-medium theme-text-primary">
                {yoink.isActive ? `${(Number(yoink.flowRate) / 10**18 * 86400).toFixed(6)} ${TOKEN_SYMBOL}/day` : "0"}
              </div>
            </div>
            
            <div>
              <div className="text-sm theme-text-secondary">Current Recipient</div>
              <div className="font-mono text-sm theme-text-primary">
                {yoink.recipient !== "0x0000000000000000000000000000000000000000" ? 
                  shortenAddress(yoink.recipient) : 
                  "None"
                }
              </div>
            </div>
          </div>
        </div>
        
        {/* Deposit and Withdraw Forms */}
        <div className="ml-4 min-w-[200px] space-y-4">
          {/* Deposit Form */}
          <div>
            <div className="text-sm theme-text-secondary mb-2">Deposit to Escrow</div>
            <form onSubmit={handleDeposit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 px-3 py-2 text-sm theme-bg-secondary theme-text-primary border theme-border rounded"
                  style={{borderWidth: '1px'}}
                  disabled={isDepositing}
                />
                <div className="text-sm theme-text-secondary flex items-center px-2">
                  {TOKEN_SYMBOL}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isDepositing || !depositAmount || !address}
                className="w-full text-sm"
              >
                {isDepositing ? "Depositing..." : "Deposit"}
              </Button>
            </form>
          </div>

          {/* Withdraw Form */}
          <div>
            <div className="text-sm theme-text-secondary mb-2">Withdraw from Escrow</div>
            <form onSubmit={handleWithdraw} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 px-3 py-2 text-sm theme-bg-secondary theme-text-primary border theme-border rounded"
                  style={{borderWidth: '1px'}}
                  disabled={isWithdrawing}
                />
                <div className="text-sm theme-text-secondary flex items-center px-2">
                  {TOKEN_SYMBOL}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isWithdrawing || !withdrawAmount || !address}
                className="w-full text-sm"
              >
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
