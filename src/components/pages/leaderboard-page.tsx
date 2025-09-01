import { LeaderboardCard } from "../leaderboard-card";

interface LeaderboardPageProps {
  address: string | null;
  copiedAddress: string | null;
  handleCopyAddress: (address: string) => void;
}

export function LeaderboardPage({
  address,
  copiedAddress,
  handleCopyAddress,
}: LeaderboardPageProps) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <LeaderboardCard
        className=""
        address={address}
        copiedAddress={copiedAddress}
        handleCopyAddress={handleCopyAddress}
      />
    </div>
  );
}
