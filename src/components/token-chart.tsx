"use client";

import { useEffect, useState } from "react";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, SOCIAL_LINKS } from "../lib/superfluid";
import { useWallet } from "../hooks/use-wallet";
import { Button } from "./ui/button";

interface TokenStats {
  price: string;
  priceChange24h: string;
  volume24h: string;
  marketCap: string;
  totalSupply: string;
  holders: string;
  isLoading: boolean;
}

interface TokenChartProps {
  className?: string;
}

export function TokenChart({ className = "" }: TokenChartProps) {
  const [chartUrl, setChartUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connectWallet } = useWallet();
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    price: "$0.00",
    priceChange24h: "0.00%",
    volume24h: "$0",
    marketCap: "$0",
    totalSupply: "0",
    holders: "0",
    isLoading: true,
  });

  // Fetch token statistics
  const fetchTokenStats = async () => {
    try {
      // Try to fetch from DEXScreener API
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]; // Use the first pair (usually highest liquidity)
        setTokenStats({
          price: `$${parseFloat(pair.priceUsd || "0").toFixed(6)}`,
          priceChange24h: `${pair.priceChange?.h24 || "0"}%`,
          volume24h: `$${formatNumber(pair.volume?.h24 || 0)}`,
          marketCap: `$${formatNumber(pair.marketCap || 0)}`,
          totalSupply: formatNumber(pair.totalSupply || 0),
          holders: "N/A", // DEXScreener doesn't provide this
          isLoading: false,
        });
      } else {
        // Fallback to mock data if no pairs found
        setTokenStats(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      // Fallback to mock data on error
      setTokenStats({
        price: "$0.004187",
        priceChange24h: "-0.06%",
        volume24h: "$125.6K",
        marketCap: "$4.18M",
        totalSupply: "1.00B",
        holders: "537",
        isLoading: false,
      });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  useEffect(() => {
    // DEXScreener embed URL format
    const dexScreenerUrl = `https://dexscreener.com/base/${TOKEN_ADDRESS}?embed=1&theme=dark&trades=0&info=0`;
    setChartUrl(dexScreenerUrl);
    setIsLoading(false);
    
    // Fetch token stats
    fetchTokenStats();
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load chart data");
  };

  // Trading functions
  const handleBuyToken = () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    // Uniswap V3 swap URL for Base network
    const uniswapUrl = `https://app.uniswap.org/swap?chain=base&outputCurrency=${TOKEN_ADDRESS}`;
    window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSellToken = () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    // Uniswap V3 swap URL for Base network (selling the token)
    const uniswapUrl = `https://app.uniswap.org/swap?chain=base&inputCurrency=${TOKEN_ADDRESS}`;
    window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
  };



  // Token stats component
  const TokenStatsPanel = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-amber-400 mb-3">Market Data</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-sm">Price</span>
            <span className="text-amber-400 font-bold">
              {tokenStats.isLoading ? "..." : tokenStats.price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-sm">24h Change</span>
            <span className={`font-bold text-sm ${
              tokenStats.priceChange24h.startsWith('-') ? 'text-red-400' : 'text-green-400'
            }`}>
              {tokenStats.isLoading ? "..." : tokenStats.priceChange24h}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-sm">Volume 24h</span>
            <span className="text-amber-400 font-bold text-sm">
              {tokenStats.isLoading ? "..." : tokenStats.volume24h}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-sm">Market Cap</span>
            <span className="text-amber-400 font-bold text-sm">
              {tokenStats.isLoading ? "..." : tokenStats.marketCap}
            </span>
          </div>
        </div>
      </div>
      
             <div className="pt-4 border-t border-amber-600/30">
         <h4 className="text-amber-400 font-bold mb-3">Trade</h4>
         <div className="space-y-2">
           <Button
             onClick={handleBuyToken}
             className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 text-sm"
           >
             {isConnected ? `Buy ${TOKEN_SYMBOL}` : 'Connect & Buy'}
           </Button>
           <Button
             onClick={handleSellToken}
             className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 text-sm"
           >
             {isConnected ? `Sell ${TOKEN_SYMBOL}` : 'Connect & Sell'}
           </Button>
         </div>
       </div>
       
       <div className="pt-4 border-t border-amber-600/30">
         <h4 className="text-amber-400 font-bold mb-3">Links</h4>
         <div className="grid grid-cols-2 gap-2">
           {/* Social Media Links */}
           {SOCIAL_LINKS.twitter && (
             <a
               href={SOCIAL_LINKS.twitter}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
             >
               𝕏 X
             </a>
           )}
           
           {SOCIAL_LINKS.farcaster && (
             <a
               href={SOCIAL_LINKS.farcaster}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
             >
               🟣 Farcaster
             </a>
           )}
           
           {SOCIAL_LINKS.telegram && (
             <a
               href={SOCIAL_LINKS.telegram}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors no-underline"
             >
               📱 Telegram
             </a>
           )}
           
           {SOCIAL_LINKS.website && (
             <a
               href={SOCIAL_LINKS.website}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
             >
               🌐 Website
             </a>
           )}
           
           {/* DEX and Blockchain Links - Always Show */}
           <a
             href={`https://dexscreener.com/base/${TOKEN_ADDRESS}`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
           >
             📊 DEXScreener
           </a>
           
           <a
             href={`https://basescan.org/token/${TOKEN_ADDRESS}`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors no-underline"
           >
             🔗 BaseScan
           </a>
           
           <button
             onClick={() => {
               navigator.clipboard.writeText(TOKEN_ADDRESS);
               // Could add a toast notification here
             }}
             className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors col-span-2"
             title="Copy contract address to clipboard"
           >
             📋 Copy Contract Address
           </button>
         </div>
       </div>
    </div>
  );

  if (error) {
    return (
      <div className={`bg-gray-900 border border-amber-600 rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-6 text-amber-400">{TOKEN_SYMBOL} Trading</h2>
        
        {/* Mobile: Stats on top, Chart below */}
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Stats Panel - Full width on mobile, 1/3 on desktop */}
          <div className="lg:w-1/3 mb-6 lg:mb-0">
            <TokenStatsPanel />
          </div>
          
          {/* Chart Panel - Full width on mobile, 2/3 on desktop */}
          <div className="lg:w-2/3">
            <div className="bg-gray-800/50 rounded-lg border border-amber-600/30 p-4">
              <div className="flex items-center justify-center h-64 lg:h-96 text-amber-600">
                <div className="text-center">
                  <div className="text-lg mb-2">Chart temporarily unavailable</div>
                  <div className="text-sm text-amber-500">Unable to load price data</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-amber-500">
          <div>
            Contract: {TOKEN_ADDRESS.slice(0, 6)}...{TOKEN_ADDRESS.slice(-4)}
          </div>
          <a
            href={`https://dexscreener.com/base/${TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            View on DEXScreener
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-amber-600 rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-6 text-amber-400">{TOKEN_SYMBOL} Trading</h2>
      
      {/* Mobile: Stats on top, Chart below - Desktop: Stats left (1/3), Chart right (2/3) */}
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Stats Panel - Full width on mobile, 1/3 on desktop */}
        <div className="lg:w-1/3 mb-6 lg:mb-0">
          <TokenStatsPanel />
        </div>
        
        {/* Chart Panel - Full width on mobile, 2/3 on desktop */}
        <div className="lg:w-2/3">
          <div className="bg-gray-800/50 rounded-lg border border-amber-600/30 p-4">
            <h3 className="text-lg font-bold text-amber-400 mb-3">Price Chart</h3>
            
            {isLoading && (
              <div className="flex items-center justify-center h-64 lg:h-96 text-amber-600">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-2"></div>
                  <div>Loading chart...</div>
                </div>
              </div>
            )}
            
            <div className="relative h-64 lg:h-96 rounded-lg overflow-hidden border border-amber-600/20">
              <iframe
                src={chartUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="clipboard-write"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                title={`${TOKEN_SYMBOL} Price Chart`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
