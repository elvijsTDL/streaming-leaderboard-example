import { TokenChart } from "../token-chart";
import { StremeCard } from "../streme-card";
import { CHAIN_ID } from "../../lib/superfluid";

export function AnalyticsPage() {
  const isBaseNetwork = CHAIN_ID === 8453;
  
  return (
    <div className={`grid grid-cols-1 gap-8 ${isBaseNetwork ? 'lg:grid-cols-3' : ''}`}>
      <TokenChart className={isBaseNetwork ? "lg:col-span-2" : ""} />
      
      {isBaseNetwork && <StremeCard className="lg:col-span-1" />}
    </div>
  );
}
