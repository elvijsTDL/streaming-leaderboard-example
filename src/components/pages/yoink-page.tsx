import { useState } from "react";
import { Button } from "../ui/button";
import { shortenAddress } from "../../lib/utils";
import { TOKEN_SYMBOL } from "../../lib/superfluid";

// Mock data for yoink stats
const mockYoinkStats = {
  totalYoinkers: 42,
  totalYoinks: 156,
  yoinkableBalance: "1,234.567",
  yoinkFlowRate: "12.345"
};

// Mock data for yoinking leaderboard
const mockYoinkLeaderboard = [
  { address: "0x1234567890123456789012345678901234567890", totalYoinked: "567.890", rank: 1 },
  { address: "0x2345678901234567890123456789012345678901", totalYoinked: "445.123", rank: 2 },
  { address: "0x3456789012345678901234567890123456789012", totalYoinked: "334.456", rank: 3 },
  { address: "0x4567890123456789012345678901234567890123", totalYoinked: "223.789", rank: 4 },
  { address: "0x5678901234567890123456789012345678901234", totalYoinked: "178.234", rank: 5 },
  { address: "0x6789012345678901234567890123456789012345", totalYoinked: "145.567", rank: 6 },
  { address: "0x7890123456789012345678901234567890123456", totalYoinked: "123.890", rank: 7 },
  { address: "0x8901234567890123456789012345678901234567", totalYoinked: "98.123", rank: 8 },
  { address: "0x9012345678901234567890123456789012345678", totalYoinked: "76.456", rank: 9 },
  { address: "0x0123456789012345678901234567890123456789", totalYoinked: "54.789", rank: 10 },
];

interface YoinkPageProps {
  className?: string;
}

export function YoinkPage({ className = "" }: YoinkPageProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [yoinkAmount, setYoinkAmount] = useState("");

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleYoink = () => {
    // TODO: Implement yoink functionality when contracts are ready
    console.log("Yoinking:", yoinkAmount);
    alert(`Yoinking ${yoinkAmount} ${TOKEN_SYMBOL}! (Mock implementation)`);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Yoink Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Yoink Card */}
        <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
          <h2 className="text-xl font-bold mb-4 theme-text-primary">CREATE YOINK</h2>
          <div className="space-y-4">
            <div>
              <label className="block theme-text-secondary text-sm font-medium mb-2">
                Yoink Amount ({TOKEN_SYMBOL})
              </label>
              <input
                type="number"
                value={yoinkAmount}
                onChange={(e) => setYoinkAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 theme-card-bg border theme-border rounded-md theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{borderWidth: '1px'}}
              />
            </div>
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-xs mb-1">Available to Yoink</div>
              <div className="theme-text-primary font-bold">{mockYoinkStats.yoinkableBalance} {TOKEN_SYMBOL}</div>
            </div>
            <Button 
              onClick={handleYoink}
              disabled={!yoinkAmount || parseFloat(yoinkAmount) <= 0}
              className="w-full theme-button text-black font-bold"
            >
              YOINK IT!
            </Button>
            <div className="text-xs theme-text-muted">
              * Mock implementation - contracts in development
            </div>
          </div>
        </div>

        {/* Yoink Stats Card */}
        <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
          <h2 className="text-xl font-bold mb-4 theme-text-primary">YOINK STATS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Total Yoinkers</div>
              <div className="theme-text-primary font-bold text-lg">{mockYoinkStats.totalYoinkers.toLocaleString()}</div>
            </div>
            <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Total Yoinks</div>
              <div className="theme-text-primary font-bold text-lg">{mockYoinkStats.totalYoinks.toLocaleString()}</div>
            </div>
            <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Yoinkable {TOKEN_SYMBOL} Balance</div>
              <div className="theme-text-primary font-bold text-xl">{mockYoinkStats.yoinkableBalance} {TOKEN_SYMBOL}</div>
            </div>
            <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
              <div className="theme-text-secondary text-sm">Yoink Flow Rate</div>
              <div className="theme-text-primary font-bold text-xl">{mockYoinkStats.yoinkFlowRate} {TOKEN_SYMBOL}/day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Yoinking Leaderboard */}
      <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">TOP YOINKERS</h2>
        <div className="space-y-3">
          {mockYoinkLeaderboard.map((entry) => (
            <div key={entry.address} className="flex items-center justify-between p-3 rounded theme-card-bg border theme-border" style={{borderWidth: '1px'}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                  #{entry.rank}
                </div>
                <img 
                  src="/placeholder.svg" 
                  alt="avatar" 
                  className="w-6 h-6 rounded-full border theme-border" 
                />
                <div className="flex-1 min-w-0">
                  <div className="theme-text-primary font-medium">
                    {shortenAddress(entry.address)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(entry.address)}
                    className="flex items-center gap-1 theme-text-secondary text-xs hover:theme-text-primary transition-colors cursor-pointer group max-w-full"
                    title="Click to copy address"
                  >
                    <span className="font-mono">{shortenAddress(entry.address)}</span>
                    <span className="text-[10px] opacity-60 group-hover:opacity-100 flex-shrink-0">
                      {copiedAddress === entry.address ? '✓' : '📋'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="theme-text-primary font-bold">
                  {entry.totalYoinked} {TOKEN_SYMBOL}
                </div>
                <div className="theme-text-muted text-xs">total yoinked</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <div className="text-xs theme-text-muted">
            * Mock data - real leaderboard coming with contract deployment
          </div>
        </div>
      </div>
    </div>
  );
}
