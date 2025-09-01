import { TokenChart } from "../token-chart";
import { StremeCard } from "../streme-card";

export function AnalyticsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <TokenChart className="lg:col-span-2" />
      
      <StremeCard className="lg:col-span-1" />
    </div>
  );
}
