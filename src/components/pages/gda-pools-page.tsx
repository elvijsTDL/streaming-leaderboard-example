import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLatestGDAPools, useActiveGDAPools, useCheckPoolAdmin } from '../../hooks/queries/use-gda-pools';
import { useUserPoolMemberships } from '../../hooks/queries/use-user-pool-memberships';
import { formatFlowRatePerDay, TOKEN_SYMBOL } from '../../lib/superfluid';
import { StreamingBalance } from '../streaming-balance';
import { resolveManyProfiles, type ResolvedProfile } from '../../lib/whois';
import { shortenAddress } from '../../lib/utils';
import { Button } from '../ui/button';
import { GDAPoolDetailsModal } from '../gda-pool-details-modal';
import { GDAPoolCreateForm } from '../gda-pool-create-form';
import { GDAPoolManagementModal } from '../gda-pool-management-modal';
import type { GDAPool } from '../../queries/gda-pools';

export function GDAPoolsPage() {
  const { address } = useAccount();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState<GDAPool | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ResolvedProfile>>({});

  const { data: poolsData, isLoading } = useLatestGDAPools(20, 0);
  const { data: activePoolsData, isLoading: isLoadingActive } = useActiveGDAPools(10, 0);
  const { data: adminPoolsData } = useCheckPoolAdmin(address || null);
  const { data: membershipData } = useUserPoolMemberships(address || null);

  const allPools = poolsData?.pools || [];
  const activePools = activePoolsData?.pools || [];
  const adminPools = adminPoolsData?.pools || [];
  const userMemberships = membershipData?.poolMembers || [];

  // Combine and deduplicate pools, prioritizing active ones
  const pools = [...activePools, ...allPools.filter(p => !activePools.some(ap => ap.id === p.id))];

  // Resolve profiles for all admin addresses
  useEffect(() => {
    const allAddresses = [...new Set([
      ...pools.map(pool => pool.admin.id.toLowerCase()),
      ...adminPools.map(pool => pool.admin.id.toLowerCase()),
      ...userMemberships.map(membership => membership.pool.admin.id.toLowerCase())
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
  }, [pools, adminPools, userMemberships]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const getDisplayName = (adminAddress: string) => {
    const profile = profiles[adminAddress.toLowerCase()];
    return profile?.recommendedName || profile?.ENS?.handle || profile?.Farcaster?.handle || shortenAddress(adminAddress);
  };

  const getAvatar = (adminAddress: string) => {
    const profile = profiles[adminAddress.toLowerCase()];
    return profile?.recommendedAvatar || profile?.Farcaster?.avatarUrl || profile?.ENS?.avatarUrl || "/placeholder.svg";
  };

  const handlePoolClick = (poolId: string) => {
    setSelectedPool(poolId);
  };

  const handleManagePool = (pool: GDAPool) => {
    setShowManagementModal(pool);
  };

  const isPoolAdmin = (pool: GDAPool) => {
    return address && address.toLowerCase() === pool.admin.id.toLowerCase();
  };

  if (isLoading || isLoadingActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-border"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-text-primary">GDA Pools</h1>
          <p className="theme-text-secondary mt-2">
            General Distribution Agreement pools for {TOKEN_SYMBOL} token
          </p>
        </div>
        <div>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Pool
          </Button>
        </div>
      </div>

      {/* Your Pools Section */}
      {adminPools.length > 0 && (
        <div className="theme-card-bg theme-border rounded-xl p-6" style={{borderWidth: '1px'}}>
          <h2 className="text-xl font-bold theme-text-primary mb-6">Your Pools</h2>
          <div className="space-y-3">
            {adminPools.map((pool, index) => (
              <div
                key={pool.id}
                className={`theme-card-bg theme-border rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer ${
                  index > 0 ? 'border-t theme-border pt-4' : ''
                }`}
                style={{borderWidth: '1px'}}
                onClick={() => handlePoolClick(pool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <img 
                      src={getAvatar(pool.admin.id)} 
                      alt="Admin avatar" 
                      className="w-8 h-8 rounded-full border theme-border" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="theme-text-primary font-semibold">
                        {pool.token.symbol} Pool
                      </div>
                      <div className="font-mono text-xs theme-text-secondary">
                        {shortenAddress(pool.id)}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Members</div>
                        <div className="theme-text-primary font-semibold">{pool.totalMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Flow Rate/Day</div>
                        <div className="theme-text-primary font-semibold">
                          {pool.flowRate ? formatFlowRatePerDay(pool.flowRate) : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManagePool(pool);
                    }}
                    className="text-xs px-4 py-2"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Pool Memberships Section */}
      {userMemberships.length > 0 && (
        <div className="theme-card-bg theme-border rounded-xl p-6" style={{borderWidth: '1px'}}>
          <h2 className="text-xl font-bold theme-text-primary mb-6">Your Pool Memberships</h2>
          <div className="space-y-3">
            {userMemberships.map((membership, index) => (
              <div
                key={membership.id}
                className={`theme-card-bg theme-border rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer ${
                  index > 0 ? 'border-t theme-border pt-4' : ''
                }`}
                style={{borderWidth: '1px'}}
                onClick={() => handlePoolClick(membership.pool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <img 
                      src={getAvatar(membership.pool.admin.id)} 
                      alt="Pool admin avatar" 
                      className="w-8 h-8 rounded-full border theme-border" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="theme-text-primary font-semibold">
                          {membership.pool.token.symbol} Pool
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          membership.isConnected 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {membership.isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                      </div>
                      <div className="font-mono text-xs theme-text-secondary">
                        {shortenAddress(membership.pool.id)}
                      </div>
                      <div className="text-xs theme-text-secondary">
                        Admin: {getDisplayName(membership.pool.admin.id)} • Created: {formatTimestamp(membership.pool.createdAtTimestamp)}
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Total Members</div>
                        <div className="theme-text-primary font-semibold">{membership.pool.totalMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Pool Flow/Day</div>
                        <div className="theme-text-primary font-semibold">
                          {formatFlowRatePerDay(membership.pool.flowRate)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">You Received</div>
                        <div className="theme-text-primary font-semibold">
                          {membership.totalAmountReceivedUntilUpdatedAt && membership.totalAmountReceivedUntilUpdatedAt !== '0' ? (
                            <StreamingBalance
                              initialBalance={membership.totalAmountReceivedUntilUpdatedAt}
                              initialTimestamp={membership.updatedAtTimestamp}
                              flowRatePerSecond={membership.pool.flowRate}
                              decimals={18}
                              symbol={membership.pool.token.symbol}
                              className="font-semibold"
                              decimalPlaces={6}
                            />
                          ) : (
                            `0 ${membership.pool.token.symbol}`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePoolClick(membership.pool.id);
                    }}
                    className="text-xs px-4 py-2 bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                  >
                    View Pool
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Pools Section */}
      {activePools.length > 0 && (
        <div className="theme-card-bg theme-border rounded-xl p-6" style={{borderWidth: '1px'}}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold theme-text-primary">Active Pools</h2>
            <div className="text-sm theme-text-secondary">
              {activePools.length} active pools
            </div>
          </div>
          <div className="space-y-3">
            {activePools.map((pool, index) => (
              <div
                key={pool.id}
                className={`theme-card-bg theme-border rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer ${
                  index > 0 ? 'mt-3' : ''
                }`}
                style={{borderWidth: '1px'}}
                onClick={() => handlePoolClick(pool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <img 
                      src={getAvatar(pool.admin.id)} 
                      alt="Admin avatar" 
                      className="w-8 h-8 rounded-full border theme-border" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="theme-text-primary font-semibold">
                          {pool.token.symbol} Pool
                        </div>
                        <div className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">
                          Active
                        </div>
                        {isPoolAdmin(pool) && (
                          <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded">
                            Admin
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-xs theme-text-secondary">
                        {shortenAddress(pool.id)}
                      </div>
                      <div className="text-xs theme-text-secondary">
                        Admin: {getDisplayName(pool.admin.id)} • Created: {formatTimestamp(pool.createdAtTimestamp)}
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Members</div>
                        <div className="theme-text-primary font-semibold">{pool.totalMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Connected</div>
                        <div className="theme-text-primary font-semibold">{pool.totalConnectedMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Flow Rate/Day</div>
                        <div className="theme-text-primary font-semibold">
                          {pool.flowRate ? formatFlowRatePerDay(pool.flowRate) : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePoolClick(pool.id);
                      }}
                      className="text-xs px-3 py-1 bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Details
                    </Button>
                    {isPoolAdmin(pool) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManagePool(pool);
                        }}
                        className="text-xs px-3 py-1"
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Pools Section */}
      <div className="theme-card-bg theme-border rounded-xl p-6" style={{borderWidth: '1px'}}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold theme-text-primary">All Pools</h2>
          <div className="text-sm theme-text-secondary">
            {pools.length} total pools
          </div>
        </div>

        {pools.length > 0 ? (
          <div className="space-y-3">
            {pools.map((pool, index) => (
              <div
                key={pool.id}
                className={`theme-card-bg theme-border rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer ${
                  index > 0 ? 'mt-3' : ''
                }`}
                style={{borderWidth: '1px'}}
                onClick={() => handlePoolClick(pool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <img 
                      src={getAvatar(pool.admin.id)} 
                      alt="Admin avatar" 
                      className="w-8 h-8 rounded-full border theme-border" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="theme-text-primary font-semibold">
                          {pool.token.symbol} Pool
                        </div>
                        {isPoolAdmin(pool) && (
                          <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded">
                            Admin
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-xs theme-text-secondary">
                        {shortenAddress(pool.id)}
                      </div>
                      <div className="text-xs theme-text-secondary">
                        Admin: {getDisplayName(pool.admin.id)} • Created: {formatTimestamp(pool.createdAtTimestamp)}
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Members</div>
                        <div className="theme-text-primary font-semibold">{pool.totalMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Connected</div>
                        <div className="theme-text-primary font-semibold">{pool.totalConnectedMembers}</div>
                      </div>
                      <div className="text-center">
                        <div className="theme-text-secondary text-xs">Flow Rate/Day</div>
                        <div className="theme-text-primary font-semibold">
                          {pool.flowRate ? formatFlowRatePerDay(pool.flowRate) : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePoolClick(pool.id);
                      }}
                      className="text-xs px-3 py-1 bg-transparent theme-text-primary theme-border hover:theme-card-bg"
                    >
                      Details
                    </Button>
                    {isPoolAdmin(pool) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManagePool(pool);
                        }}
                        className="text-xs px-3 py-1"
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏊</div>
            <h3 className="text-xl font-semibold theme-text-primary mb-2">No {TOKEN_SYMBOL} Pools Found</h3>
            <p className="theme-text-secondary mb-4">
              No GDA pools have been created for {TOKEN_SYMBOL} yet.
            </p>
            <p className="theme-text-secondary mb-4">
              GDA pools allow you to distribute tokens proportionally to multiple recipients with just one transaction.
            </p>
            <div className="theme-card-bg theme-border rounded-lg p-4 mb-6 text-left max-w-md mx-auto" style={{borderWidth: '1px'}}>
              <h4 className="font-semibold theme-text-primary mb-2">After creating a pool, you can:</h4>
              <ul className="text-sm theme-text-secondary space-y-1">
                <li>• Add members with distribution units</li>
                <li>• Distribute tokens proportionally</li>
                <li>• Stream continuous distributions</li>
                <li>• Manage member connections</li>
              </ul>
            </div>
            <p className="theme-text-secondary mb-6">
              Be the first to create a pool and start distributing {TOKEN_SYMBOL} to members!
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create First Pool
            </Button>
          </div>
        )}
      </div>

      {/* How GDA Pools Work */}
      <div className="theme-card-bg theme-border rounded-xl p-6" style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold theme-text-primary mb-4">How GDA Pools Work</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <h3 className="font-semibold theme-text-primary mb-3">For Pool Admins</h3>
            <ul className="text-sm theme-text-secondary space-y-2">
              <li>• Create pools for your token</li>
              <li>• Add and manage members with distribution units</li>
              <li>• Set and update units for proportional distributions</li>
              <li>• Distribute tokens instantly or stream continuously</li>
              <li>• Transfer admin rights to other addresses</li>
            </ul>
          </div>
          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <h3 className="font-semibold theme-text-primary mb-3">For Pool Members</h3>
            <ul className="text-sm theme-text-secondary space-y-2">
              <li>• Receive proportional distributions based on units</li>
              <li>• Connect to pools to receive streaming flows</li>
              <li>• View your units and earnings in real-time</li>
              <li>• Automatic distribution when tokens flow to pool</li>
              <li>• No gas costs for receiving distributions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPool && (
        <GDAPoolDetailsModal
          poolAddress={selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}

      {showCreateForm && (
        <GDAPoolCreateForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {showManagementModal && (
        <GDAPoolManagementModal
          pool={showManagementModal}
          onClose={() => setShowManagementModal(null)}
        />
      )}
    </div>
  );
}
