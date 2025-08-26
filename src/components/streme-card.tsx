"use client";

import { useEffect, useState } from "react";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, fetchStremeTokenData, fetchTopPoolMembers, fetchUniswapPoolData, type StremeTokenData, type PoolMember, type UniswapPoolData } from "../lib/superfluid";
import { resolveManyProfiles, type ResolvedProfile } from "../lib/whois";
import { shortenAddress } from "../lib/utils";

interface StremeCardProps {
  className?: string;
}

export function StremeCard({ className = "" }: StremeCardProps) {
  const [stremeData, setStremeData] = useState<StremeTokenData | null>(null);
  const [poolMembers, setPoolMembers] = useState<PoolMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, ResolvedProfile>>({});
  const [uniswapData, setUniswapData] = useState<UniswapPoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingUniswap, setIsLoadingUniswap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchStremeTokenData(TOKEN_ADDRESS);
        
        if (cancelled) return;
        
        if (data) {
          setStremeData(data);
          
          // Fetch pool members if staking pool is available
          if (data.staking_pool) {
            setIsLoadingMembers(true);
            try {
              const members = await fetchTopPoolMembers(data.staking_pool, 10);
              if (!cancelled) {
                setPoolMembers(members);
                // Resolve profiles for pool members
                const addresses = members.map(m => m.account);
                const profiles = await resolveManyProfiles(addresses);
                if (!cancelled) {
                  setMemberProfiles(profiles);
                }
              }
            } catch (err) {
              console.error('Error fetching pool members:', err);
            } finally {
              if (!cancelled) {
                setIsLoadingMembers(false);
              }
            }
          }

          // Fetch Uniswap pool data if pool address is available
          if (data.pool_address) {
            setIsLoadingUniswap(true);
            try {
              const uniData = await fetchUniswapPoolData(data.pool_address);
              if (!cancelled) {
                setUniswapData(uniData);
              }
            } catch (err) {
              console.error('Error fetching Uniswap pool data:', err);
            } finally {
              if (!cancelled) {
                setIsLoadingUniswap(false);
              }
            }
          }
        } else {
          setError("No Streme data found for this token");
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to fetch Streme data");
          console.error("Streme data fetch error:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };



  // If loading
  if (isLoading) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">STREME DATA</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 theme-border mx-auto mb-2"></div>
          <div className="theme-text-muted">Loading Streme data...</div>
        </div>
      </div>
    );
  }

  // If error or no data
  if (error || !stremeData) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">STREME DATA</h2>
        <div className="text-center py-8">
          <div className="theme-text-muted mb-2">⚠️</div>
          <div className="theme-text-muted text-sm">
            {error || "This token is not available on Streme"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold theme-text-primary">STREME DATA</h2>
        <img 
          src={stremeData.img_url} 
          alt={stremeData.name}
          className="w-8 h-8 rounded-full border theme-border"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e";
          }}
        />
      </div>

      <div className="space-y-6">
        {/* Token Creator Section */}
        <div className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
          <h3 className="text-lg font-bold theme-text-primary mb-3">Token Creator</h3>
          {stremeData.username && stremeData.username.trim() !== "" ? (
            <a
              href={`https://warpcast.com/${stremeData.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 rounded-lg theme-card-bg hover:theme-card-bg transition-colors group no-underline"
            >
              <img 
                src={stremeData.creator?.profileImage || stremeData.pfp_url || "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e"} 
                alt={stremeData.creator?.name || stremeData.username || "Creator"}
                className="w-12 h-12 rounded-full border theme-border group-hover:theme-border transition-colors"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e";
                }}
              />
              <div className="flex-1">
                <div className="theme-text-primary font-bold group-hover:theme-text-primary transition-colors">
                  @{stremeData.username}
                </div>
                <div className="theme-text-secondary text-sm">{stremeData.creator?.name || stremeData.username}</div>
                <div className="theme-text-muted text-xs mt-1">Click to view on Warpcast →</div>
              </div>
            </a>
          ) : (
            <div className="flex items-center space-x-3 p-3 rounded-lg theme-card-bg">
              <img 
                src={stremeData.creator?.profileImage || stremeData.pfp_url || "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e"} 
                alt="Creator"
                className="w-12 h-12 rounded-full border theme-border"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%219CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e";
                }}
              />
              <div className="flex-1">
                <div className="theme-text-primary font-bold">Creator Address</div>
                <button
                  onClick={() => {
                    if (stremeData.deployer) {
                      navigator.clipboard.writeText(stremeData.deployer);
                    }
                  }}
                  className="theme-text-secondary text-sm hover:theme-text-primary cursor-pointer font-mono"
                  title="Click to copy deployer address"
                >
                  {stremeData.deployer ? shortenAddress(stremeData.deployer) : "Unknown"}
                </button>
                <div className="theme-text-muted text-xs mt-1">No Warpcast profile available</div>
              </div>
            </div>
          )}
        </div>



        {/* Staking & Pool Info Section */}
        <div className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
          <h3 className="text-lg font-bold theme-text-primary mb-3">Staking & Pool Info</h3>
          <div className="space-y-3 text-sm">
            {stremeData.staking_pool && (
              <div className="flex justify-between items-center p-2 theme-card-bg rounded">
                <span className="theme-text-secondary">Staking Pool</span>
                <button
                  onClick={() => {
                    if (stremeData.staking_pool) {
                      navigator.clipboard.writeText(stremeData.staking_pool);
                    }
                  }}
                  className="theme-text-primary font-mono text-xs hover:theme-text-primary cursor-pointer"
                  title="Click to copy"
                >
                  {stremeData.staking_pool ? shortenAddress(stremeData.staking_pool) : "Unknown"}
                </button>
              </div>
            )}
            {stremeData.pool_address && (
              <div className="flex justify-between items-center p-2 theme-card-bg rounded">
                <span className="theme-text-secondary">Uniswap Pool Address</span>
                <button
                  onClick={() => {
                    if (stremeData.pool_address) {
                      navigator.clipboard.writeText(stremeData.pool_address);
                    }
                  }}
                  className="theme-text-primary font-mono text-xs hover:theme-text-primary cursor-pointer"
                  title="Click to copy"
                >
                  {stremeData.pool_address ? shortenAddress(stremeData.pool_address) : "Unknown"}
                </button>
              </div>
            )}
            <div className="flex justify-between items-center p-2 theme-card-bg rounded">
              <span className="theme-text-secondary">Paired Token</span>
              <span className="theme-text-primary font-bold">{stremeData.pair || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Uniswap Pool Data Section */}
        {stremeData.pool_address && (
          <div className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
            <h3 className="text-lg font-bold theme-text-primary mb-3">Uniswap Pool Data</h3>
            {isLoadingUniswap ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 theme-border mx-auto mb-2"></div>
                <div className="theme-text-muted text-sm">Loading pool data...</div>
              </div>
            ) : uniswapData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="theme-card-bg rounded p-3">
                    <div className="theme-text-secondary">Fee Tier</div>
                    <div className="theme-text-primary font-bold">{(uniswapData.feeTier / 10000).toFixed(2)}%</div>
                  </div>
                  <div className="theme-card-bg rounded p-3">
                    <div className="theme-text-secondary">Transaction Count</div>
                    <div className="theme-text-primary font-bold">{uniswapData.txCount.toLocaleString()}</div>
                  </div>
                  {uniswapData.totalLiquidity && (
                    <div className="theme-card-bg rounded p-3">
                      <div className="theme-text-secondary">Total Liquidity</div>
                      <div className="theme-text-primary font-bold">${formatNumber(uniswapData.totalLiquidity.value)}</div>
                    </div>
                  )}
                  {uniswapData.volume24h && (
                    <div className="theme-card-bg rounded p-3">
                      <div className="theme-text-secondary">24h Volume</div>
                      <div className="theme-text-primary font-bold">${formatNumber(uniswapData.volume24h.value)}</div>
                    </div>
                  )}
                  {uniswapData.totalLiquidityPercentChange24h && (
                    <div className="theme-card-bg rounded p-3 col-span-2">
                      <div className="theme-text-secondary">24h Liquidity Change</div>
                      <div className={`font-bold ${uniswapData.totalLiquidityPercentChange24h.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {uniswapData.totalLiquidityPercentChange24h.value >= 0 ? '+' : ''}{uniswapData.totalLiquidityPercentChange24h.value.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Token Pair Information */}
                <div>
                  <div className="theme-text-primary font-bold mb-2">Token Pair</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="theme-card-bg rounded p-3">
                      <div className="theme-text-secondary">Token 0</div>
                      <div className="theme-text-primary font-bold">{uniswapData.token0.symbol}</div>
                      <div className="theme-text-secondary text-xs">{formatNumber(Number(uniswapData.token0Supply))} tokens</div>
                      {uniswapData.token0.market?.price && (
                        <div className="theme-text-primary text-xs">${uniswapData.token0.market.price.value.toFixed(6)}</div>
                      )}
                    </div>
                    <div className="theme-card-bg rounded p-3">
                      <div className="theme-text-secondary">Token 1</div>
                      <div className="theme-text-primary font-bold">{uniswapData.token1.symbol}</div>
                      <div className="theme-text-secondary text-xs">{formatNumber(Number(uniswapData.token1Supply))} tokens</div>
                      {uniswapData.token1.market?.price && (
                        <div className="theme-text-primary text-xs">${uniswapData.token1.market.price.value.toFixed(6)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="theme-text-muted text-center py-4 text-sm">Pool data not available</div>
            )}
          </div>
        )}

        {/* Top Stakers Section */}
        {stremeData.staking_pool && (
          <div className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
            <h3 className="text-lg font-bold theme-text-primary mb-3">Top 10 Streme Stakers</h3>
            {isLoadingMembers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 theme-border mx-auto mb-2"></div>
                <div className="theme-text-muted text-sm">Loading stakers...</div>
              </div>
            ) : poolMembers.length > 0 ? (
              <div className="space-y-2">
                {poolMembers.map((member, index) => {
                  const profile = memberProfiles[member.account.toLowerCase()];
                  const name = profile?.recommendedName || profile?.ENS?.handle || profile?.Farcaster?.handle || shortenAddress(member.account);
                  const avatar = profile?.recommendedAvatar || profile?.Farcaster?.avatarUrl || profile?.ENS?.avatarUrl || "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e";
                  
                  return (
                    <div key={member.account} className="flex items-center justify-between p-3 rounded theme-card-bg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-xs">
                          {index + 1}
                        </div>
                        <img 
                          src={avatar} 
                          alt={name}
                          className="w-8 h-8 rounded-full border theme-border"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='32' cy='32' r='32' fill='%23374151'/%3e%3ccircle cx='32' cy='26' r='8' fill='%239CA3AF'/%3e%3cpath d='M16 56C16 48 22 42 32 42C42 42 48 48 48 56' fill='%239CA3AF'/%3e%3c/svg%3e";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="theme-text-primary font-medium text-sm">{name}</div>
                          <button
                            onClick={() => navigator.clipboard.writeText(member.account)}
                            className="theme-text-secondary text-xs hover:theme-text-primary cursor-pointer font-mono"
                            title="Click to copy address"
                          >
                            {shortenAddress(member.account)}
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="theme-text-primary font-bold text-sm">{Number(member.units).toLocaleString()} ${TOKEN_SYMBOL}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="theme-text-muted text-center py-4 text-sm">No stakers found</div>
            )}
          </div>
        )}

        {/* Links Section */}
        <div className="theme-card-bg rounded-lg p-4 border theme-border" style={{borderWidth: '1px'}}>
          <h3 className="text-lg font-bold theme-text-primary mb-3">Streme Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {stremeData.contract_address && (
              <a
                href={`https://streme.fun/token/${stremeData.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
              >
                🟣 Streme Page
              </a>
            )}
            {stremeData.cast_hash && (
              <a
                href={`https://warpcast.com/~/conversations/${stremeData.cast_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
              >
                💬 Launch Cast
              </a>
            )}
            {stremeData.deployer && (
              <a
                href={`https://basescan.org/address/${stremeData.deployer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
              >
                👤 Deployer
              </a>
            )}
            {stremeData.tx_hash && (
              <a
                href={`https://basescan.org/tx/${stremeData.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
              >
                🔗 Deploy Tx
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
