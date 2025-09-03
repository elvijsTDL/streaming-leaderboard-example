import { TOKEN_SYMBOL } from "../lib/superfluid";

interface YoinkStatsData {
  totalYoinkers: number;
  totalYoinks: number;
  yoinkableBalance: string;
  yoinkFlowRate: string;
}

interface YoinkStatsCardProps {
  className?: string;
  stats: YoinkStatsData;
}

export function YoinkStatsCard({ className = "", stats }: YoinkStatsCardProps) {
  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <h2 className="text-xl font-bold mb-4 theme-text-primary">YOINK STATS</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Total Yoinkers</div>
          <div className="theme-text-primary font-bold text-lg">{stats.totalYoinkers.toLocaleString()}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Total Yoinks</div>
          <div className="theme-text-primary font-bold text-lg">{stats.totalYoinks.toLocaleString()}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Yoinkable {TOKEN_SYMBOL} Balance</div>
          <div className="theme-text-primary font-bold text-xl">{stats.yoinkableBalance} {TOKEN_SYMBOL}</div>
        </div>
        <div className="theme-card-bg rounded p-3 border theme-border col-span-2" style={{borderWidth: '1px'}}>
          <div className="theme-text-secondary text-sm">Yoink Flow Rate</div>
          <div className="theme-text-primary font-bold text-xl">{stats.yoinkFlowRate} {TOKEN_SYMBOL}/day</div>
        </div>
      </div>
    </div>
  );
}
