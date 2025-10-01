import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "./ui/button";
import { useEscrowBalance, useEscrowDistributionRate, useSharedYoinkDetails } from "../hooks/queries/use-yoink-data";
import { SHARED_YOINK_CONFIG, SHARED_YOINK_ESCROW_ABI, ESCROW_TOKEN_ABI } from "../lib/yoink-contracts";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "../lib/superfluid";

interface EscrowManagementCardProps {
  className?: string;
}

export function EscrowManagementCard({ className = "" }: EscrowManagementCardProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: escrowBalance, isLoading: balanceLoading } = useEscrowBalance();
  const { data: distributionRate, isLoading: rateLoading } = useEscrowDistributionRate();
  const { data: yoinkDetails } = useSharedYoinkDetails();
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !walletClient || !fundAmount) {
      alert("Please connect your wallet and enter an amount");
      return;
    }

    setIsFunding(true);
    
    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(fundAmount) * 10**18));
      
      // Transfer tokens to escrow
      const hash = await walletClient.writeContract({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ESCROW_TOKEN_ABI,
        functionName: "transfer",
        args: [SHARED_YOINK_CONFIG.ESCROW as `0x${string}`, amountWei],
      });

      console.log("Escrow funding transaction:", hash);
      setFundAmount("");
      alert("Funding transaction submitted! Check your wallet for status.");
    } catch (error) {
      console.error("Error funding escrow:", error);
      alert("Failed to fund escrow. Check console for details.");
    } finally {
      setIsFunding(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !walletClient || !withdrawAmount) {
      alert("Please connect your wallet and enter an amount");
      return;
    }

    setIsWithdrawing(true);
    
    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 10**18));
      
      const hash = await walletClient.writeContract({
        address: SHARED_YOINK_CONFIG.ESCROW as `0x${string}`,
        abi: SHARED_YOINK_ESCROW_ABI,
        functionName: "withdraw",
        args: [amountWei],
      });

      console.log("Withdrawal transaction:", hash);
      setWithdrawAmount("");
      alert("Withdrawal transaction submitted! Check your wallet for status.");
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to withdraw. Check console for details.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!address || !walletClient) {
      alert("Please connect your wallet");
      return;
    }

    const confirmed = confirm("Are you sure you want to emergency withdraw all funds?");
    if (!confirmed) return;

    setIsWithdrawing(true);
    
    try {
      const hash = await walletClient.writeContract({
        address: SHARED_YOINK_CONFIG.ESCROW as `0x${string}`,
        abi: SHARED_YOINK_ESCROW_ABI,
        functionName: "emergencyWithdraw",
        args: [],
      });

      console.log("Emergency withdrawal transaction:", hash);
      alert("Emergency withdrawal submitted! Check your wallet for status.");
    } catch (error) {
      console.error("Error with emergency withdrawal:", error);
      alert("Failed to emergency withdraw. Check console for details.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (balanceLoading || rateLoading) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">ESCROW MANAGEMENT</h2>
        <div className="text-center">
          <p className="theme-text-secondary">Loading escrow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">ESCROW MANAGEMENT</h2>
      
      {/* Escrow Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Flowing Balance</div>
          <div className="theme-text-primary font-bold text-lg">
            {(Number(escrowBalance) / 10**18).toFixed(4)} {TOKEN_SYMBOL}
          </div>
          <div className="theme-text-muted text-xs">Current escrow balance</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Distribution Rate</div>
          <div className="theme-text-primary font-bold text-lg">
            {distributionRate} {TOKEN_SYMBOL}/day
          </div>
          <div className="theme-text-muted text-xs">Streaming to current recipient</div>
        </div>
      </div>

      {/* Current Status */}
      <div className="theme-card-bg rounded p-4 border theme-border mb-6" style={{borderWidth: '1px'}}>
        <div className="theme-text-secondary text-sm mb-2">Current Status</div>
        <div className="flex justify-between items-center">
          <div>
            <div className={`font-bold ${yoinkDetails?.isActive ? 'text-green-400' : 'text-red-400'}`}>
              {yoinkDetails?.isActive ? "ACTIVELY STREAMING" : "INACTIVE"}
            </div>
            {yoinkDetails?.recipient && yoinkDetails.recipient !== "0x0000000000000000000000000000000000000000" && (
              <div className="theme-text-secondary text-xs mt-1">
                To: {yoinkDetails.recipient.slice(0, 6)}...{yoinkDetails.recipient.slice(-4)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="theme-text-secondary text-xs">Yoink ID</div>
            <div className="theme-text-primary font-bold">#{SHARED_YOINK_CONFIG.YOINK_ID}</div>
          </div>
        </div>
      </div>

      {/* Fund Escrow */}
      <form onSubmit={handleFund} className="space-y-4 mb-6">
        <h3 className="font-bold theme-text-primary">Fund Escrow</h3>
        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Amount ({TOKEN_SYMBOL})
          </label>
          <input
            type="number"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isFunding || !address || !fundAmount}
          className="w-full theme-button text-black font-bold"
        >
          {isFunding ? "Funding..." : "FUND ESCROW"}
        </Button>
      </form>

      {/* Withdraw from Escrow */}
      <form onSubmit={handleWithdraw} className="space-y-4 mb-4">
        <h3 className="font-bold theme-text-primary">Withdraw from Escrow</h3>
        <div>
          <label className="block theme-text-secondary text-sm font-medium mb-2">
            Amount ({TOKEN_SYMBOL})
          </label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            max={(Number(escrowBalance) / 10**18).toString()}
            className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{borderWidth: '1px'}}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="submit"
            disabled={isWithdrawing || !address || !withdrawAmount}
            className="theme-button text-black font-bold"
          >
            {isWithdrawing ? "Withdrawing..." : "WITHDRAW"}
          </Button>
          <Button
            type="button"
            onClick={handleEmergencyWithdraw}
            disabled={isWithdrawing || !address}
            className="theme-button bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            EMERGENCY
          </Button>
        </div>
      </form>

      <div className="text-xs theme-text-muted">
        * Escrow: {SHARED_YOINK_CONFIG.ESCROW.slice(0, 8)}...{SHARED_YOINK_CONFIG.ESCROW.slice(-6)}
      </div>
    </div>
  );
}
