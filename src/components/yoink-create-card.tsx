import { useState } from "react";
import { Button } from "./ui/button";
import { TOKEN_SYMBOL } from "../lib/superfluid";

interface YoinkCreateCardProps {
  className?: string;
  yoinkableBalance: string;
  onYoink?: (amount: string) => void;
}

export function YoinkCreateCard({ 
  className = "", 
  yoinkableBalance,
  onYoink 
}: YoinkCreateCardProps) {
  const [yoinkAmount, setYoinkAmount] = useState("");

  const handleYoink = () => {
    if (onYoink) {
      onYoink(yoinkAmount);
    } else {
      // Default mock implementation
      console.log("Yoinking:", yoinkAmount);
      alert(`Yoinking ${yoinkAmount} ${TOKEN_SYMBOL}! (Mock implementation)`);
    }
  };

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
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
          <div className="theme-text-primary font-bold">{yoinkableBalance} {TOKEN_SYMBOL}</div>
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
  );
}
