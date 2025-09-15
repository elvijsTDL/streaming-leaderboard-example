import { useEffect, useMemo, useState } from "react";
import {
  useReadSuperToken,
  useReadCfaForwarder,
  useWriteCfaForwarder,
  useSimulateCfaForwarder,
} from "@sfpro/sdk/hook";
import { TIME_UNIT, type TimeUnit } from "@sfpro/sdk/constant";
import { calculateFlowratePerSecond } from "@sfpro/sdk/util";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatUnits, isAddress } from "viem";
import { TOKEN_ADDRESS, TOKEN_SYMBOL } from "../lib/superfluid";

type TimeUnitKey = keyof typeof TIME_UNIT;

function formatBigIntAmount(value: bigint | undefined, decimals: number | undefined, fractionDigits = 4) {
  if (value === undefined || decimals === undefined) return "-";
  const num = Number(formatUnits(value, decimals));
  if (!Number.isFinite(num)) return formatUnits(value, decimals);
  return num.toFixed(fractionDigits);
}

export function StreamCreateCard() {
  const { address } = useAccount();
  const chainId = useChainId();

  const [tokenAddress, setTokenAddress] = useState<string>(TOKEN_ADDRESS);
  const [receiver, setReceiver] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [timeUnitKey, setTimeUnitKey] = useState<TimeUnitKey>("day");

  const isValidToken = useMemo(() => isAddress(tokenAddress), [tokenAddress]);
  const isValidReceiver = useMemo(() => isAddress(receiver), [receiver]);

  // SuperToken metadata
  const { data: symbol } = useReadSuperToken({
    address: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
    chainId,
    functionName: "symbol",
    query: { enabled: isValidToken },
  });
  const { data: decimals } = useReadSuperToken({
    address: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
    chainId,
    functionName: "decimals",
    query: { enabled: isValidToken },
  });

  // SuperToken realtime balance (includes flows)
  const { data: realtimeBalance } = useReadSuperToken({
    address: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
    chainId,
    functionName: "realtimeBalanceOfNow",
    args: isValidToken && address ? [address as `0x${string}`] : undefined,
    query: { enabled: isValidToken && !!address },
  });

  const availableBalance: bigint | undefined = realtimeBalance?.[0];

  // Underlying token address
  const { data: underlyingAddress } = useReadSuperToken({
    address: isValidToken ? (tokenAddress as `0x${string}`) : undefined,
    chainId,
    functionName: "getUnderlyingToken",
    query: { enabled: isValidToken },
  });

  // Underlying balance via generic ERC20 read
  const { data: underlyingBalance } = useReadContract({
    abi: [
      { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
      { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
      { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
    ] as const,
    address: underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000" ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!underlyingAddress && !!address },
  });

  const { data: underlyingDecimals } = useReadContract({
    abi: [
      { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
    ] as const,
    address: underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000" ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "decimals",
    chainId,
    query: { enabled: !!underlyingAddress },
  });

  const { data: underlyingSymbol } = useReadContract({
    abi: [
      { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
    ] as const,
    address: underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000" ? (underlyingAddress as `0x${string}`) : undefined,
    functionName: "symbol",
    chainId,
    query: { enabled: !!underlyingAddress },
  });

  // Account net flow for this token
  const { data: accountFlowrate } = useReadCfaForwarder({
    functionName: "getAccountFlowrate",
    chainId,
    args: isValidToken && address ? [tokenAddress as `0x${string}`, address as `0x${string}`] : undefined,
    query: { enabled: isValidToken && !!address },
  });

  // Desired flowrate from amount + time unit
  const desiredFlowrate: bigint | undefined = useMemo(() => {
    const clean = amount.trim();
    if (!clean || !isValidToken) return undefined;
    try {
      const wei = parseEther(clean);
      const tu: TimeUnit = TIME_UNIT[timeUnitKey];
      return calculateFlowratePerSecond({ amountWei: wei, timeUnit: tu });
    } catch {
      return undefined;
    }
  }, [amount, timeUnitKey, isValidToken]);

  // Buffer required for the desired flow
  const { data: bufferAmount } = useReadCfaForwarder({
    functionName: "getBufferAmountByFlowrate",
    chainId,
    args: isValidToken && desiredFlowrate !== undefined ? [tokenAddress as `0x${string}`, desiredFlowrate] : undefined,
    query: { enabled: isValidToken && desiredFlowrate !== undefined },
  });

  // Preview calculations
  const preview = useMemo(() => {
    if (!address || !isValidToken || decimals === undefined) return undefined;
    const bal = availableBalance ?? 0n;
    const curNet = (accountFlowrate ?? 0n) as unknown as bigint; // int96 but represented as bigint
    const out = desiredFlowrate ?? 0n;
    const newNet = curNet - out; // receiving positive, sending negative

    const buffer = bufferAmount ?? 0n;
    const effectiveBalance = bal - buffer;

    if (newNet >= 0n) {
      return {
        indefinite: true,
        seconds: undefined as number | undefined,
        buffer,
        newNet,
      };
    }

    if (effectiveBalance <= 0n || newNet === 0n) {
      return { indefinite: false, seconds: 0, buffer, newNet };
    }

    const secs = Number(effectiveBalance / (-newNet));
    return { indefinite: false, seconds: secs, buffer, newNet };
  }, [address, isValidToken, decimals, availableBalance, accountFlowrate, desiredFlowrate, bufferAmount]);

  // Simulate + write setFlowrate
  const { data: simulation, isSuccess: simulateOk } = useSimulateCfaForwarder({
    functionName: "setFlowrate",
    chainId,
    args: isValidToken && isValidReceiver && desiredFlowrate !== undefined ? [
      tokenAddress as `0x${string}`,
      receiver as `0x${string}`,
      desiredFlowrate,
    ] : undefined,
    query: { enabled: isValidToken && isValidReceiver && desiredFlowrate !== undefined },
  });

  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteCfaForwarder();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  useEffect(() => {
    if (isConfirmed) {
      setAmount("");
      // Keep receiver to allow repeated streams
    }
  }, [isConfirmed]);

  const canSubmit = !!address && isValidToken && isValidReceiver && desiredFlowrate !== undefined && desiredFlowrate > 0n && simulateOk;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !simulation) return;
    writeContract?.(simulation.request);
  };

  return (
    <div className="theme-card-bg theme-border rounded-lg p-6 space-y-4" style={{ borderWidth: "1px" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold theme-text-primary">Start a Stream</h3>
        <div className="text-xs theme-text-muted">Network: Base</div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs theme-text-secondary mb-1">SuperToken Address</label>
            <input
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value.trim())}
              placeholder={TOKEN_ADDRESS}
              className="w-full rounded-md px-3 py-2 theme-input theme-border"
              style={{ borderWidth: "1px" }}
            />
            <div className="text-xs theme-text-muted mt-1">
              Using: {symbol ?? TOKEN_SYMBOL} {decimals !== undefined ? `(decimals: ${decimals})` : ""}
            </div>
          </div>

          <div>
            <label className="block text-xs theme-text-secondary mb-1">Receiver</label>
            <input
              value={receiver}
              onChange={(e) => setReceiver(e.target.value.trim())}
              placeholder="0x..."
              className="w-full rounded-md px-3 py-2 theme-input theme-border"
              style={{ borderWidth: "1px" }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs theme-text-secondary mb-1">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 10"
              className="w-full rounded-md px-3 py-2 theme-input theme-border"
              style={{ borderWidth: "1px" }}
            />
          </div>
          <div>
            <label className="block text-xs theme-text-secondary mb-1">Per</label>
            <select
              value={timeUnitKey}
              onChange={(e) => setTimeUnitKey(e.target.value as TimeUnitKey)}
              className="w-full rounded-md px-3 py-2 theme-input theme-border"
              style={{ borderWidth: "1px" }}
            >
              <option value="second">second</option>
              <option value="minute">minute</option>
              <option value="hour">hour</option>
              <option value="day">day</option>
              <option value="week">week</option>
              <option value="month">month</option>
              <option value="year">year</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="theme-border rounded-md p-3" style={{ borderWidth: "1px" }}>
            <div className="text-xs theme-text-secondary">SuperToken Balance</div>
            <div className="text-lg font-semibold theme-text-primary">
              {formatBigIntAmount(availableBalance ?? undefined, Number(decimals ?? 18))} {symbol ?? TOKEN_SYMBOL}
            </div>
          </div>
          <div className="theme-border rounded-md p-3" style={{ borderWidth: "1px" }}>
            <div className="text-xs theme-text-secondary">Underlying Balance</div>
            <div className="text-lg font-semibold theme-text-primary">
              {formatBigIntAmount((underlyingBalance as bigint | undefined) ?? undefined, Number(underlyingDecimals ?? 18))} {underlyingSymbol ?? ""}
            </div>
          </div>
          <div className="theme-border rounded-md p-3" style={{ borderWidth: "1px" }}>
            <div className="text-xs theme-text-secondary">Desired Flow (per second)</div>
            <div className="text-lg font-semibold theme-text-primary">
              {desiredFlowrate !== undefined ? formatUnits(desiredFlowrate, Number(decimals ?? 18)) : "-"}
            </div>
          </div>
        </div>

        <div className="theme-border rounded-md p-3 space-y-1" style={{ borderWidth: "1px" }}>
          <div className="text-sm theme-text-secondary">Preview</div>
          <div className="text-xs theme-text-muted">Buffer required: {bufferAmount !== undefined ? formatBigIntAmount(bufferAmount as bigint, Number(decimals ?? 18), 6) : "-"} {symbol ?? TOKEN_SYMBOL}</div>
          <div className="text-xs theme-text-muted">New net flow: {preview ? formatUnits(preview.newNet, Number(decimals ?? 18)) : "-"} {symbol ?? TOKEN_SYMBOL}/s</div>
          <div className="text-xs theme-text-muted">
            {preview?.indefinite ? (
              <span>Estimated duration: indefinite (non-negative net flow)</span>
            ) : (
              <span>Estimated duration: {preview?.seconds !== undefined ? `${Math.max(0, Math.floor(preview.seconds / 3600))}h ${Math.max(0, Math.floor((preview.seconds % 3600) / 60))}m` : "-"}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isWriting || isConfirming}
            className={`px-4 py-2 rounded-lg border ${canSubmit && !isWriting && !isConfirming ? "theme-border theme-text-primary hover:theme-button hover:text-black" : "theme-border theme-text-muted"}`}
            style={{ borderWidth: "1px" }}
          >
            {isWriting || isConfirming ? "Submitting…" : "Start Stream"}
          </button>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs theme-text-secondary underline"
            >
              View Tx
            </a>
          )}
          {writeError && (
            <div className="text-xs theme-text-muted">{writeError.message}</div>
          )}
        </div>
      </form>
    </div>
  );
}


