import { YoinkCreateCard } from "../yoink-create-card";
import { YoinkStatsCard } from "../yoink-stats-card";
import { YoinkLeaderboardCard } from "../yoink-leaderboard-card";
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
  const handleYoink = (amount: string) => {
    // TODO: Implement yoink functionality when contracts are ready
    console.log("Yoinking:", amount);
    alert(`Yoinking ${amount} ${TOKEN_SYMBOL}! (Mock implementation)`);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Yoink Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <YoinkCreateCard 
          yoinkableBalance={mockYoinkStats.yoinkableBalance}
          onYoink={handleYoink}
        />
        <YoinkStatsCard stats={mockYoinkStats} />
      </div>

      {/* Yoinking Leaderboard */}
      <YoinkLeaderboardCard 
        leaderboard={mockYoinkLeaderboard}
        title="🏆 TOP YOINKERS"
      />
    </div>
  );
}
