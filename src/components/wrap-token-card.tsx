import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useReadSuperToken, useSimulateSuperToken, useWriteSuperToken } from "@sfpro/sdk/hook";

function formatAmount(value: bigint | undefined, decimals: number | undefined, fractionDigits = 4) {
  if (value === undefined || decimals === undefined) return "-";
  const num = Number(formatUnits(value, decimals));
  if (!Number.isFinite(num)) return formatUnits(value, decimals);
  return num.toFixed(fractionDigits);
}

export function WrapTokenCard({ initialToken }: { initialToken: `0x${string}` }) {
  const { address } = useAccount();
  const chainId = useChainId();

  const [tokenAddress] = useState<`0x${string}`>(initialToken);
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [amount, setAmount] = useState<string>("");

  const isValidToken = useMemo(() => isAddress(tokenAddress), [tokenAddress]);

  // SuperToken metadata
  const { data: stSymbol } = useReadSuperToken({ address: isValidToken ? tokenAddress : undefined, chainId, functionName: "symbol", query: { enabled: isValidToken } });
  const { data: stDecimals } = useReadSuperToken({ address: isValidToken ? tokenAddress : undefined, chainId, functionName: "decimals", query: { enabled: isValidToken } });
  const { data: underlyingAddress } = useReadSuperToken({ address: isValidToken ? tokenAddress : undefined, chainId, functionName: "getUnderlyingToken", query: { enabled: isValidToken } });

  // Balances
  const { data: stRealtime } = useReadSuperToken({ address: isValidToken ? tokenAddress : undefined, chainId, functionName: "realtimeBalanceOfNow", args: address && isValidToken ? [address] : undefined, query: { enabled: !!address && isValidToken } });
  const stAvailable: bigint | undefined = stRealtime?.[0];

  const { data: underlyingBalance } = useReadContract({
    abi: [
      { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
      { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
      { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
    ] as const,
    address: (underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000") ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!underlyingAddress && !!address },
  });
  const { data: underlyingAllowance } = useReadContract({
    abi: [
      { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }, { name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
    ] as const,
    address: (underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000") ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, tokenAddress] : undefined,
    chainId,
    query: { enabled: !!underlyingAddress && !!address },
  });
  const { data: underlyingDecimals } = useReadContract({
    abi: [ { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] } ] as const,
    address: (underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000") ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "decimals",
    chainId,
    query: { enabled: !!underlyingAddress },
  });
  const { data: underlyingSymbol } = useReadContract({
    abi: [ { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] } ] as const,
    address: (underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000") ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "symbol",
    chainId,
    query: { enabled: !!underlyingAddress },
  });

  // Parse amount with correct decimals per mode
  const parsedAmount: bigint | undefined = useMemo(() => {
    const a = amount.trim();
    if (!a) return undefined;
    try {
      if (mode === "wrap") {
        if (underlyingDecimals === undefined) return undefined;
        return parseUnits(a, Number(underlyingDecimals));
      }
      if (stDecimals === undefined) return undefined;
      return parseUnits(a, Number(stDecimals));
    } catch {
      return undefined;
    }
  }, [amount, mode, underlyingDecimals, stDecimals]);

  // Simulate upgrade/downgrade (declare both hooks, enable only the active one to satisfy TS unions)
  const simUpgrade = useSimulateSuperToken({
    address: isValidToken ? tokenAddress : undefined,
    chainId,
    functionName: "upgrade",
    args: parsedAmount !== undefined ? [parsedAmount] : undefined,
    query: { enabled: isValidToken && parsedAmount !== undefined && mode === "wrap" },
  });
  const simDowngrade = useSimulateSuperToken({
    address: isValidToken ? tokenAddress : undefined,
    chainId,
    functionName: "downgrade",
    args: parsedAmount !== undefined ? [parsedAmount] : undefined,
    query: { enabled: isValidToken && parsedAmount !== undefined && mode === "unwrap" },
  });

  const simulation = mode === "wrap" ? simUpgrade.data : simDowngrade.data;
  const simulateOk = mode === "wrap" ? simUpgrade.isSuccess : simDowngrade.isSuccess;

  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteSuperToken();
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash, confirmations: 1 });
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveHash, confirmations: 1 });

  useEffect(() => {
    if (isConfirmed) setAmount("");
  }, [isConfirmed]);

  const needsApproval = mode === "wrap" && parsedAmount !== undefined && (underlyingAllowance ?? 0n) < parsedAmount;
  const canSubmit = isValidToken && parsedAmount !== undefined && parsedAmount > 0n && simulateOk && (!needsApproval);

  return (
    <div className="theme-card-bg theme-border rounded-lg p-4 space-y-3" style={{ borderWidth: "1px" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold theme-text-primary">Wrap / Unwrap</h3>
        <div className="text-xs theme-text-muted">Network: Base</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("wrap")}
          className={`px-3 py-1.5 rounded-md border ${mode === "wrap" ? "theme-button text-black" : "theme-border theme-text-primary"}`}
          style={{ borderWidth: "1px" }}
        >
          Wrap
        </button>
        <button
          type="button"
          onClick={() => setMode("unwrap")}
          className={`px-3 py-1.5 rounded-md border ${mode === "unwrap" ? "theme-button text-black" : "theme-border theme-text-primary"}`}
          style={{ borderWidth: "1px" }}
        >
          Unwrap
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="theme-border rounded-md p-2.5" style={{ borderWidth: "1px" }}>
          <div className="text-xs theme-text-secondary">SuperToken Balance</div>
          <div className="text-lg font-semibold theme-text-primary">{formatAmount(stAvailable, Number(stDecimals ?? 18))} {stSymbol}</div>
        </div>
        <div className="theme-border rounded-md p-2.5" style={{ borderWidth: "1px" }}>
          <div className="text-xs theme-text-secondary">Underlying Balance</div>
          <div className="text-lg font-semibold theme-text-primary">{formatAmount(underlyingBalance as bigint | undefined, Number(underlyingDecimals ?? 18))} {underlyingSymbol as string | undefined}</div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit || !simulation) return;
          writeContract?.(simulation.request);
        }}
        className="space-y-4"
      >
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs theme-text-secondary mb-1">Amount</label>
            <div className="flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 10"
                className="w-full rounded-md px-3 py-2 theme-input theme-border"
                style={{ borderWidth: "1px" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (mode === "wrap") {
                    if (underlyingBalance && underlyingDecimals !== undefined) {
                      setAmount(formatUnits(underlyingBalance as bigint, Number(underlyingDecimals)));
                    }
                  } else {
                    if (stAvailable && stDecimals !== undefined) {
                      setAmount(formatUnits(stAvailable as bigint, Number(stDecimals)));
                    }
                  }
                }}
                className="px-3 py-2 rounded-md border theme-border theme-text-primary hover:theme-button hover:text-black"
                style={{ borderWidth: "1px" }}
              >
                Max
              </button>
            </div>
          </div>
          <div className="flex items-end gap-2">
            {mode === "wrap" && (
              <button
                type="button"
                disabled={!needsApproval || isApproving || isApproveConfirming || parsedAmount === undefined}
                onClick={() => {
                  if (!underlyingAddress || parsedAmount === undefined) return;
                  writeApprove?.({
                    abi: [ { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] } ] as const,
                    address: underlyingAddress as `0x${string}`,
                    functionName: "approve",
                    args: [tokenAddress, parsedAmount],
                    chainId,
                  });
                }}
                className={`px-3 py-2 rounded-lg border ${needsApproval && !isApproving && !isApproveConfirming ? "theme-border theme-text-primary hover:theme-button hover:text-black" : "theme-border theme-text-muted"}`}
                style={{ borderWidth: "1px" }}
              >
                {isApproving || isApproveConfirming ? "Approving…" : "Approve"}
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit || isWriting || isConfirming}
              className={`flex-1 px-3 py-2 rounded-lg border ${canSubmit && !isWriting && !isConfirming ? "theme-border theme-text-primary hover:theme-button hover:text-black" : "theme-border theme-text-muted"}`}
              style={{ borderWidth: "1px" }}
            >
              {isWriting || isConfirming ? (mode === "wrap" ? "Wrapping…" : "Unwrapping…") : (mode === "wrap" ? "Wrap" : "Unwrap")}
            </button>
          </div>
        </div>

        {txHash && (
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-xs theme-text-secondary underline">View Tx</a>
        )}
        {approveHash && (
          <a href={`https://basescan.org/tx/${approveHash}`} target="_blank" rel="noreferrer" className="text-xs theme-text-secondary underline ml-2">Approve Tx</a>
        )}
        {writeError && <div className="text-xs theme-text-muted">{writeError.message}</div>}
        {approveError && <div className="text-xs theme-text-muted">{approveError.message}</div>}
      </form>
    </div>
  );
}


