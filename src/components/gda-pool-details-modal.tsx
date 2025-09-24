import { useState, useEffect } from 'react';
import { useGDAPoolDetails, useGDAPoolMembers, useGDAPoolDistributors } from '../hooks/queries/use-gda-pools';
import { formatFlowRatePerDay } from '../lib/superfluid';
import { StreamingBalance } from './streaming-balance';
import { resolveManyProfiles, type ResolvedProfile } from '../lib/whois';
import { shortenAddress } from '../lib/utils';
import { fetchPoolDataFromRPC, type PoolRPCData } from '../lib/pool-rpc';
import { Button } from './ui/button';

interface GDAPoolDetailsModalProps {
  poolAddress: string | null;
  onClose: () => void;
}

export function GDAPoolDetailsModal({ poolAddress, onClose }: GDAPoolDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'distributors'>('members');
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [rpcData, setRpcData] = useState<PoolRPCData | null>(null);
  const [isLoadingRPC, setIsLoadingRPC] = useState(false);
  const [membersPage, setMembersPage] = useState(0);
  const [distributorsPage, setDistributorsPage] = useState(0);
  const membersPerPage = 10;
  const distributorsPerPage = 10;
  
  const { data: poolDetails, isLoading: poolLoading } = useGDAPoolDetails(poolAddress);
  const { data: membersData, isLoading: membersLoading } = useGDAPoolMembers(
    poolAddress, 
    membersPerPage, 
    membersPage * membersPerPage
  );
  const { data: distributorsData, isLoading: distributorsLoading } = useGDAPoolDistributors(
    poolAddress, 
    distributorsPerPage, 
    distributorsPage * distributorsPerPage
  );

  if (!poolAddress) return null;

  const pool = poolDetails?.pool;
  const members = membersData?.poolMembers || [];
  const distributors = distributorsData?.poolDistributors || [];

  // Fetch real-time pool data from RPC
  useEffect(() => {
    if (!poolAddress) return;

    setIsLoadingRPC(true);
    fetchPoolDataFromRPC(poolAddress)
      .then(data => {
        setRpcData(data);
        setIsLoadingRPC(false);
      })
      .catch(() => {
        setIsLoadingRPC(false);
      });
  }, [poolAddress]);

  // Resolve profiles for members and distributors
  useEffect(() => {
    const allAddresses = [...new Set([
      ...members.map(member => member.account.id.toLowerCase()),
      ...distributors.map(distributor => distributor.account.id.toLowerCase())
    ])];

    if (allAddresses.length === 0) return;

    let cancelled = false;
    resolveManyProfiles(allAddresses)
      .then(resolvedProfiles => {
        if (!cancelled) {
          setProfiles(resolvedProfiles);
        }
      })
      .catch(() => {
        // ignore profile resolution errors
      });

    return () => {
      cancelled = true;
    };
  }, [members, distributors]);

  if (poolLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-border"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-bold theme-text-primary mb-4">Pool Not Found</h2>
            <p className="theme-text-secondary mb-6">The requested pool could not be found.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const getDisplayName = (accountAddress: string) => {
    const profile = profiles[accountAddress.toLowerCase()];
    return profile?.recommendedName || profile?.ENS?.handle || profile?.Farcaster?.handle || shortenAddress(accountAddress);
  };

  const getAvatar = (accountAddress: string) => {
    const profile = profiles[accountAddress.toLowerCase()];
    return profile?.recommendedAvatar || profile?.Farcaster?.avatarUrl || profile?.ENS?.avatarUrl || "/placeholder.svg";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold theme-text-primary mb-2">
              {pool.token.symbol} Pool Details
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

        {/* Pool Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Total Members</div>
            <div className="text-xl font-bold theme-text-primary">
              {pool.totalMembers || 0}
              {isLoadingRPC && <span className="text-xs ml-2">⟳</span>}
            </div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Connected Members</div>
            <div className="text-xl font-bold theme-text-primary">
              {pool.totalConnectedMembers || 0}
              {isLoadingRPC && <span className="text-xs ml-2">⟳</span>}
            </div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">
              Flow Rate/Day
              {rpcData && <span className="text-xs ml-1">(Live)</span>}
            </div>
            <div className="text-xl font-bold theme-text-primary">
              {rpcData ? 
                formatFlowRatePerDay(rpcData.totalFlowRate) : 
                (pool.flowRate ? formatFlowRatePerDay(pool.flowRate) : '0')
              } {pool.token.symbol}
              {isLoadingRPC && <span className="text-xs ml-2">⟳</span>}
            </div>
          </div>
        </div>

        {/* Additional Pool Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Admin</div>
            <div className="flex items-center gap-2">
              <img 
                src={getAvatar(pool.admin.id)} 
                alt="Admin avatar" 
                className="w-6 h-6 rounded-full border theme-border" 
              />
              <div>
                <div className="text-sm theme-text-primary font-semibold">{getDisplayName(pool.admin.id)}</div>
                <div className="text-xs font-mono theme-text-secondary">{shortenAddress(pool.admin.id)}</div>
              </div>
            </div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Created</div>
            <div className="text-sm theme-text-primary">{formatTimestamp(pool.createdAtTimestamp)}</div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Total Distributed</div>
            <div className="text-sm theme-text-primary">
              {pool.totalAmountFlowedDistributedUntilUpdatedAt && pool.totalAmountFlowedDistributedUntilUpdatedAt !== '0' ? (
                <StreamingBalance
                  initialBalance={pool.totalAmountFlowedDistributedUntilUpdatedAt}
                  initialTimestamp={pool.updatedAtTimestamp}
                  flowRatePerSecond={pool.flowRate}
                  decimals={18}
                  symbol={pool.token.symbol}
                  className="text-sm"
                  decimalPlaces={6}
                />
              ) : (
                `0 ${pool.token.symbol}`
              )}
            </div>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <div className="text-sm theme-text-secondary mb-1">Last Updated</div>
            <div className="text-sm theme-text-primary">{formatTimestamp(pool.updatedAtTimestamp)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b theme-border mb-4">
          <button
            onClick={() => {
              setActiveTab('members');
              setMembersPage(0);
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'members'
                ? 'theme-text-primary border-b-2 theme-button'
                : 'theme-text-secondary hover:theme-text-primary'
            }`}
          >
            Members ({pool?.totalMembers || members.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('distributors');
              setDistributorsPage(0);
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'distributors'
                ? 'theme-text-primary border-b-2 theme-button'
                : 'theme-text-secondary hover:theme-text-primary'
            }`}
          >
            Distributors ({distributors.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'members' && (
            <div>
              {membersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 theme-border"></div>
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div 
                      key={member.id} 
                      className={`theme-card-bg theme-border rounded-lg p-4 flex items-center justify-between ${
                        index > 0 ? 'border-t theme-border pt-4' : ''
                      }`}
                      style={{borderWidth: '1px'}}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                          #{membersPage * membersPerPage + index + 1}
                        </div>
                        <img 
                          src={getAvatar(member.account.id)} 
                          alt="Member avatar" 
                          className="w-8 h-8 rounded-full border theme-border" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="theme-text-primary font-semibold">
                            {getDisplayName(member.account.id)}
                          </div>
                          <div className="font-mono text-xs theme-text-secondary">
                            {shortenAddress(member.account.id)}
                          </div>
                          <div className="text-xs theme-text-secondary">
                            Updated: {formatTimestamp(member.updatedAtTimestamp)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm theme-text-primary">
                            {member.totalAmountReceivedUntilUpdatedAt && member.totalAmountReceivedUntilUpdatedAt !== '0' ? (
                              <StreamingBalance
                                initialBalance={member.totalAmountReceivedUntilUpdatedAt}
                                initialTimestamp={member.updatedAtTimestamp}
                                flowRatePerSecond={pool.flowRate}
                                decimals={18}
                                symbol={pool.token.symbol}
                                className="text-sm"
                                decimalPlaces={6}
                              />
                            ) : (
                              `0 ${pool.token.symbol}`
                            )}
                          </div>
                          <div className="text-xs theme-text-secondary">Total Received</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xs px-2 py-1 rounded ${
                            member.isConnected 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {member.isConnected ? 'Connected' : 'Disconnected'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center theme-text-secondary py-8">
                  No members found for this pool.
                </div>
              )}
              
              {/* Members Pagination */}
              {members.length > 0 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t theme-border">
                  <div className="text-sm theme-text-secondary">
                    Showing {membersPage * membersPerPage + 1}-{Math.min((membersPage + 1) * membersPerPage, (membersPage + 1) * membersPerPage)} of {pool?.totalMembers || 'many'} members
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setMembersPage(Math.max(0, membersPage - 1))}
                      disabled={membersPage === 0}
                      className="px-3 py-1 text-sm bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setMembersPage(membersPage + 1)}
                      disabled={members.length < membersPerPage}
                      className="px-3 py-1 text-sm bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'distributors' && (
            <div>
              {distributorsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 theme-border"></div>
                </div>
              ) : distributors.length > 0 ? (
                <div className="space-y-3">
                  {distributors.map((distributor, index) => (
                    <div 
                      key={distributor.id} 
                      className={`theme-card-bg theme-border rounded-lg p-4 flex items-center justify-between ${
                        index > 0 ? 'border-t theme-border pt-4' : ''
                      }`}
                      style={{borderWidth: '1px'}}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                          #{distributorsPage * distributorsPerPage + index + 1}
                        </div>
                        <img 
                          src={getAvatar(distributor.account.id)} 
                          alt="Distributor avatar" 
                          className="w-8 h-8 rounded-full border theme-border" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="theme-text-primary font-semibold">
                            {getDisplayName(distributor.account.id)}
                          </div>
                          <div className="font-mono text-xs theme-text-secondary">
                            {shortenAddress(distributor.account.id)}
                          </div>
                          <div className="text-xs theme-text-secondary">
                            Updated: {formatTimestamp(distributor.updatedAtTimestamp)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold theme-text-primary">
                            {distributor.flowRate ? formatFlowRatePerDay(distributor.flowRate) : '0'} {pool.token.symbol}
                          </div>
                          <div className="text-xs theme-text-secondary">Flow Rate/Day</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm theme-text-primary">
                            {distributor.totalAmountFlowedDistributedUntilUpdatedAt && distributor.totalAmountFlowedDistributedUntilUpdatedAt !== '0' ? (
                              <StreamingBalance
                                initialBalance={distributor.totalAmountFlowedDistributedUntilUpdatedAt}
                                initialTimestamp={distributor.updatedAtTimestamp}
                                flowRatePerSecond={distributor.flowRate}
                                decimals={18}
                                symbol={pool.token.symbol}
                                className="text-sm"
                                decimalPlaces={6}
                              />
                            ) : (
                              `0 ${pool.token.symbol}`
                            )}
                          </div>
                          <div className="text-xs theme-text-secondary">Total Flowed</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center theme-text-secondary py-8">
                  No distributors found for this pool.
                </div>
              )}
              
              {/* Distributors Pagination */}
              {distributors.length > 0 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t theme-border">
                  <div className="text-sm theme-text-secondary">
                    Showing {distributorsPage * distributorsPerPage + 1}-{Math.min((distributorsPage + 1) * distributorsPerPage, (distributorsPage + 1) * distributorsPerPage)} distributors
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setDistributorsPage(Math.max(0, distributorsPage - 1))}
                      disabled={distributorsPage === 0}
                      className="px-3 py-1 text-sm bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setDistributorsPage(distributorsPage + 1)}
                      disabled={distributors.length < distributorsPerPage}
                      className="px-3 py-1 text-sm bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
