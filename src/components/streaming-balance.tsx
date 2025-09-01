import { useEffect, useState } from "react";
import { formatUnits } from "viem";

interface StreamingBalanceProps {
  /** Initial balance at a specific timestamp (in wei/smallest unit) */
  initialBalance: string;
  /** Timestamp when the initial balance was recorded (in seconds) */
  initialTimestamp: string;
  /** Flow rate per second (in wei/smallest unit per second) */
  flowRatePerSecond: string;
  /** Token decimals for formatting */
  decimals?: number;
  /** Token symbol to display */
  symbol?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show decimals (default: 2) */
  decimalPlaces?: number;
  /** Whether to animate the updates (default: true) */
  animate?: boolean;
}

export function StreamingBalance({
  initialBalance,
  initialTimestamp,
  flowRatePerSecond,
  decimals = 18,
  symbol = "",
  className = "",
  decimalPlaces = 2,
  animate = true,
}: StreamingBalanceProps) {
  const [currentBalance, setCurrentBalance] = useState<string>("0");

  useEffect(() => {
    const updateBalance = () => {
      const now = Date.now(); // Current timestamp in milliseconds
      const elapsedMilliseconds = now - (parseInt(initialTimestamp) * 1000);
      const elapsedSeconds = elapsedMilliseconds / 1000; // Precise elapsed time in seconds
      
      // Calculate current balance: initial + (flowRate * precise elapsed time)
      const initialBigInt = BigInt(initialBalance);
      const flowRateBigInt = BigInt(flowRatePerSecond);
      
      // Use precise elapsed seconds (including fractions)
      const elapsedTokens = flowRateBigInt * BigInt(Math.floor(elapsedSeconds * 1000)) / BigInt(1000);
      const currentBalanceBigInt = initialBigInt + elapsedTokens;
      
      // Format the balance
      const formatted = formatUnits(currentBalanceBigInt, decimals);
      const number = parseFloat(formatted);
      
      setCurrentBalance(
        number.toLocaleString(undefined, {
          maximumFractionDigits: decimalPlaces,
          minimumFractionDigits: decimalPlaces, // Always show the same number of decimal places
        })
      );
    };

    // Update immediately
    updateBalance();

    // Set up interval for real-time updates (100ms = 0.1 seconds for smooth animation)
    const interval = setInterval(updateBalance, 100);

    return () => clearInterval(interval);
  }, [initialBalance, initialTimestamp, flowRatePerSecond, decimals, decimalPlaces]);

  return (
    <span 
      className={`${animate ? 'transition-all duration-100 ease-linear' : ''} ${className}`}
      title={`Streaming at ${formatUnits(BigInt(flowRatePerSecond), decimals)} ${symbol}/second`}
    >
      {currentBalance}
      {symbol && ` ${symbol}`}
    </span>
  );
}

// Utility function to create streaming balance props from common Superfluid data
export function createStreamingBalanceProps(
  totalAmountStreamed: string,
  totalAmountStreamedTimestamp: string,
  outflowRate: string,
  decimals = 18,
  symbol = ""
) {
  return {
    initialBalance: totalAmountStreamed,
    initialTimestamp: totalAmountStreamedTimestamp,
    flowRatePerSecond: outflowRate,
    decimals,
    symbol,
  };
}
