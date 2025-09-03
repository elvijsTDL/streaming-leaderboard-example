import { useState } from "react";
import { useAccount } from "wagmi";
import { LeaderboardCard } from "../leaderboard-card";

export function LeaderboardPage() {
  const { address } = useAccount();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (addressToCopy: string) => {
      await navigator.clipboard.writeText(addressToCopy);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <LeaderboardCard
        className=""
        address={address ?? null}
        copiedAddress={copiedAddress}
        handleCopyAddress={handleCopyAddress}
      />
    </div>
  );
}
