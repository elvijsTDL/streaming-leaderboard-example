import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress, parseEther } from 'viem';
import { Button } from './ui/button';
import { formatFlowRatePerDay, TOKEN_ADDRESS } from '../lib/superfluid';
import { StreamingBalance } from './streaming-balance';
import { useGDAPoolMembers } from '../hooks/queries/use-gda-pools';
import type { GDAPool } from '../queries/gda-pools';

interface GDAPoolManagementModalProps {
  pool: GDAPool | null;
  onClose: () => void;
}

export function GDAPoolManagementModal({ pool, onClose }: GDAPoolManagementModalProps) {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'members' | 'distribute' | 'settings'>('members');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [distributionAmount, setDistributionAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: membersData, refetch: refetchMembers } = useGDAPoolMembers(pool?.id || null);
  
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (!pool || !address) return null;

  const isAdmin = address.toLowerCase() === pool.admin.id.toLowerCase();
  const members = membersData?.poolMembers || [];

  // Handle transaction success
  if (isSuccess && isProcessing) {
    setIsProcessing(false);
    refetchMembers();
    setNewMemberAddress('');
    setDistributionAmount('');
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold theme-text-primary mb-4">Access Denied</h2>
            <p className="theme-text-secondary mb-6">You are not the admin of this pool.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  // Pool contract ABI for member management
  const poolABI = [
    {
      type: 'function',
      name: 'updateMemberUnits',
      inputs: [
        { name: 'memberAddr', type: 'address' },
        { name: 'newUnits', type: 'uint128' }
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable'
    }
  ];

  // GDA contract ABI for distribution
  const gdaABI = [
    {
      type: 'function',
      name: 'distribute',
      inputs: [
        { name: 'token', type: 'address' },
        { name: 'from', type: 'address' },
        { name: 'pool', type: 'address' },
        { name: 'requestedAmount', type: 'uint256' },
        { name: 'ctx', type: 'bytes' }
      ],
      outputs: [{ name: 'newCtx', type: 'bytes' }],
      stateMutability: 'nonpayable'
    }
  ];

  const handleAddMember = async () => {
    if (!isAddress(newMemberAddress)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call updateMemberUnits on the pool contract to add member with 1 unit
      writeContract({
        address: pool.id as `0x${string}`,
        abi: poolABI,
        functionName: 'updateMemberUnits',
        args: [
          newMemberAddress as `0x${string}`,
          BigInt(1)
        ],
      });
    } catch (error) {
      console.error('Error adding member:', error);
      setIsProcessing(false);
    }
  };


  const handleDistribute = async () => {
    if (!distributionAmount || Number(distributionAmount) <= 0) return;

    setIsProcessing(true);
    
    try {
      // GDA contract address for Base mainnet
      const GDA_ADDRESS = '0xfE6c87BE05feDB2059d2EC41bA0A09826C9FD7aa';
      
      writeContract({
        address: GDA_ADDRESS as `0x${string}`,
        abi: gdaABI,
        functionName: 'distribute',
        args: [
          TOKEN_ADDRESS as `0x${string}`,
          address as `0x${string}`,
          pool.id as `0x${string}`,
          parseEther(distributionAmount),
          '0x' // empty context bytes
        ],
      });
    } catch (error) {
      console.error('Error distributing:', error);
      setIsProcessing(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold theme-text-primary mb-2">
              Manage Pool - {pool.token.symbol}
            </h2>
            <p className="theme-text-secondary font-mono text-sm">
              {pool.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="theme-text-secondary hover:theme-text-primary text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Pool Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="theme-card-bg theme-border rounded-lg p-4">
            <div className="text-sm theme-text-secondary mb-1">Total Members</div>
            <div className="text-xl font-bold theme-text-primary">{pool.totalMembers}</div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4">
            <div className="text-sm theme-text-secondary mb-1">Flow Rate/Day</div>
            <div className="text-xl font-bold theme-text-primary">
              {formatFlowRatePerDay(pool.flowRate)} {pool.token.symbol}
            </div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4">
            <div className="text-sm theme-text-secondary mb-1">Connected</div>
            <div className="text-xl font-bold theme-text-primary">{pool.totalConnectedMembers}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b theme-border mb-4">
          {['members', 'distribute', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'theme-text-primary border-b-2 theme-button'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Add New Member */}
              <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
                <h3 className="font-semibold theme-text-primary mb-4">Add New Member</h3>
                {members.length === 0 && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      This pool is empty. Add your first member with units to start distributing tokens!
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Member Address
                    </label>
                    <input
                      type="text"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 theme-card-bg theme-border rounded-lg theme-text-primary font-mono text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={handleAddMember}
                      disabled={!isAddress(newMemberAddress) || isProcessing || isConfirming}
                      className="w-full"
                    >
                      {isProcessing || isConfirming ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="font-semibold theme-text-primary mb-4">Current Members</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      tokenSymbol={pool.token.symbol}
                      poolFlowRate={pool.flowRate}
                    />
                  ))}
                  {members.length === 0 && (
                    <div className="text-center theme-text-secondary py-8">
                      No members in this pool yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distribute' && (
            <div className="space-y-6">
              <div className="theme-card-bg theme-border rounded-lg p-4">
                <h3 className="font-semibold theme-text-primary mb-4">Distribute Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Amount to Distribute ({pool.token.symbol})
                    </label>
                    <input
                      type="number"
                      value={distributionAmount}
                      onChange={(e) => setDistributionAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 theme-card-bg theme-border rounded-lg theme-text-primary"
                    />
                  </div>
                  <Button
                    onClick={handleDistribute}
                    disabled={!distributionAmount || isProcessing || isConfirming}
                    className="w-full"
                  >
                    {isProcessing || isConfirming ? 'Distributing...' : 'Distribute to Pool'}
                  </Button>
                </div>
              </div>

              <div className="theme-card-bg theme-border rounded-lg p-4 border-yellow-500/20 bg-yellow-500/5">
                <h3 className="font-semibold text-yellow-500 mb-2">Distribution Info</h3>
                <p className="text-sm text-yellow-500/80">
                  Tokens will be distributed proportionally to all connected members based on their units.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="theme-card-bg theme-border rounded-lg p-4">
                <h3 className="font-semibold theme-text-primary mb-4">Pool Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Transfer Admin Rights
                    </label>
                    <p className="text-sm theme-text-secondary mb-2">
                      Transfer admin control to another address (irreversible)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New admin address (0x...)"
                        className="flex-1 px-3 py-2 theme-card-bg theme-border rounded-lg theme-text-primary font-mono text-sm"
                      />
                      <Button className="px-6 bg-red-600 hover:bg-red-700">
                        Transfer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="theme-card-bg theme-border rounded-lg p-4 border-red-500/20 bg-red-500/5">
                <h3 className="font-semibold text-red-500 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-500/80 mb-4">
                  These actions are irreversible. Please be careful.
                </p>
                <Button className="bg-red-600 hover:bg-red-700">
                  Close Pool
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ 
  member, 
  tokenSymbol,
  poolFlowRate
}: { 
  member: any; 
  tokenSymbol: string;
  poolFlowRate: string;
}) {

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="theme-card-bg theme-border rounded-lg p-4 flex justify-between items-center">
      <div className="flex-1">
        <div className="font-mono text-sm theme-text-primary">
          {truncateAddress(member.account.id)}
        </div>
        <div className="text-xs theme-text-secondary">
          {member.isConnected ? (
            <span className="text-green-500">Connected</span>
          ) : (
            <span className="text-red-500">Disconnected</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
            <div>
              <div className="text-xs theme-text-secondary">
                {member.totalAmountReceivedUntilUpdatedAt && member.totalAmountReceivedUntilUpdatedAt !== '0' ? (
                  <StreamingBalance
                    initialBalance={member.totalAmountReceivedUntilUpdatedAt}
                    initialTimestamp={member.updatedAtTimestamp}
                    flowRatePerSecond={poolFlowRate}
                    decimals={18}
                    symbol={tokenSymbol}
                    className="text-xs"
                    decimalPlaces={6}
                  />
                ) : (
                  `0 ${tokenSymbol} received`
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
