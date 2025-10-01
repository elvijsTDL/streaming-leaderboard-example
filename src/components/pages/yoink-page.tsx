import { YoinkCreateCard } from "../yoink-create-card";
import { YoinkLeaderboardCard } from "../yoink-leaderboard-card";
import { EscrowManagementCard } from "../escrow-management-card";
import { YoinkItem } from "../yoink-item";
import { useUserYoinks, useIsYoinkEnabled, useSharedYoinkDetails, useYoinkLeaderboard } from "../../hooks/queries/use-yoink-data";
import { isSharedYoinkEnabled } from "../../lib/yoink-contracts";
import { useAccount } from "wagmi";


interface YoinkPageProps {
  className?: string;
}

export function YoinkPage({ className = "" }: YoinkPageProps) {
  const { address } = useAccount();
  const isYoinkEnabled = useIsYoinkEnabled();
  const isSharedEnabled = isSharedYoinkEnabled();
  const { data: userYoinks } = useUserYoinks();
  const { data: sharedYoinkDetails } = useSharedYoinkDetails();
  const { data: leaderboardData } = useYoinkLeaderboard();
  const hasUserYoinks = !!userYoinks && userYoinks.length > 0;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 theme-text-primary">
          YOINK PROTOCOL 
        </h1>
        <p className="theme-text-secondary text-lg">
          {isSharedEnabled 
            ? "Free-for-all yoinking - Anyone can redirect the stream!"
            : isYoinkEnabled 
              ? "Decentralized streaming management on Optimism Sepolia"
              : "Decentralized streaming management (Optimism Sepolia only)"
          }
        </p>
      </div>
      {/* Info Section */}
      <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
        <h3 className="text-xl font-bold mb-4 theme-text-primary">
          {isSharedEnabled ? "How Free-for-All Yoinking Works" : "How Yoink Works"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isSharedEnabled ? (
            <>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">1. Create with OpenYoinkAgent</h4>
                <p className="theme-text-secondary text-sm">
                  Create a yoink with OpenYoinkAgent so anyone can redirect the stream to themselves.
                </p>
              </div>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">2. Deposit to Escrow</h4>
                <p className="theme-text-secondary text-sm">
                  Fund the escrow contract with the chosen token to power the ongoing stream.
                </p>
              </div>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">3. Let the Yoink Begin</h4>
                <p className="theme-text-secondary text-sm">
                  Set the environment variables with the deployed contracts and yoink id and let the yoinking begin.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">1. Create with OpenYoinkAgent</h4>
                <p className="theme-text-secondary text-sm">
                  Create a yoink contract that sets OpenYoinkAgent as the yoink agent to enable public yoinking.
                </p>
              </div>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">2. Deposit to Escrow</h4>
                <p className="theme-text-secondary text-sm">
                  Send the token to the escrow contract so the stream has funds to distribute.
                </p>
              </div>
              <div>
                <h4 className="font-bold theme-text-primary mb-2">3. Let the Yoink Begin</h4>
                <p className="theme-text-secondary text-sm">
                Set the environment variables with the deployed contracts and yoink id and let the yoinking begin.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Action Cards */}
      <div className={`grid grid-cols-1 gap-8 ${isSharedEnabled ? 'lg:grid-cols-2' : (hasUserYoinks ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}`}>
        <YoinkCreateCard />
        {isSharedEnabled && sharedYoinkDetails?.admin && address && sharedYoinkDetails.admin.toLowerCase() === address.toLowerCase() && (
          <EscrowManagementCard />
        )}
      </div>

      {/* User's Yoinks - Only show when environment variables are NOT set */}
      {isYoinkEnabled && userYoinks && userYoinks.length > 0 && !isSharedEnabled && (
        <div className="theme-card-bg theme-border rounded-lg p-6" style={{borderWidth: '1px'}}>
          <h3 className="text-xl font-bold mb-4 theme-text-primary">Your Yoinks</h3>
          <div className="space-y-4">
            {userYoinks.map((yoink, index) => (
              <YoinkItem key={index} yoink={yoink} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Yoinking Leaderboard */}
      {isSharedEnabled && (
        <YoinkLeaderboardCard 
          leaderboard={(leaderboardData || []).map((e, idx) => ({
            address: e.address,
            totalYoinked: e.totalYoinked,
            totalReceived: e.totalReceived,
            lastYoinkTime: e.lastYoinkTime,
            isCurrentlyReceiving: e.isCurrentlyReceiving,
            currentFlowRate: e.currentFlowRate,
            rank: idx + 1,
          }))}
          title="🏆 TOP YOINKERS"
          showMockNotice={false}
        />
      )}

    </div>
  );
}
