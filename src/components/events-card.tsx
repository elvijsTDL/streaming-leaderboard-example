import { useEffect, useState } from "react";
import { fetchTokenEvents, type TokenEvent, TOKEN_ADDRESS, TOKEN_SYMBOL } from "../lib/superfluid";
import { shortenAddress } from "../lib/utils";
import { formatUnits } from "viem";

interface EventsCardProps {
  className?: string;
}

export function EventsCard({ className }: EventsCardProps) {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tokenEvents = await fetchTokenEvents(TOKEN_ADDRESS, 5);
        setEvents(tokenEvents);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error loading events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const formatEventName = (name: string) => {
    // Convert camelCase to readable format
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case 'FlowUpdated':
        return '🌊';
      case 'Transfer':
        return '💸';
      case 'PoolCreated':
        return '🏊';
      case 'PoolDistribution':
        return '💰';
      case 'IndexCreated':
        return '📊';
      default:
        return '📅';
    }
  };

  const formatEventValue = (event: TokenEvent) => {
    if (event.name === 'Transfer' && event.value) {
      try {
        const value = formatUnits(BigInt(event.value), 18);
        return `${Number(value).toLocaleString()} ${TOKEN_SYMBOL}`;
      } catch {
        return '';
      }
    }
    if (event.name === 'FlowUpdated' && event.flowRate) {
      try {
        const flowRate = formatUnits(BigInt(event.flowRate), 18);
        const perDay = Number(flowRate) * 86400; // seconds in a day
        return `${perDay.toLocaleString()} ${TOKEN_SYMBOL}/day`;
      } catch {
        return '';
      }
    }
    if (event.name === 'PoolDistribution' && event.actualAmount) {
      try {
        const amount = formatUnits(BigInt(event.actualAmount), 18);
        return `${Number(amount).toLocaleString()} ${TOKEN_SYMBOL}`;
      } catch {
        return '';
      }
    }
    return '';
  };

  // TODO: Use CMS tokenlist to check if an address is Streme-related
  // Function to check if an address might be Streme-related (basic heuristic)
  const isStremeRelated = (_address: string) => {
    return false;
  };

  const getEventDescription = (event: TokenEvent) => {
    switch (event.name) {
      case 'FlowUpdated':
        if (event.flowRate === '0') {
          return 'Flow stopped';
        }
        return `Flow: ${formatEventValue(event)}`;
      case 'Transfer':
        const value = formatEventValue(event);
        let description = value ? `Transfer: ${value}` : 'Transfer';
        
        // Check if this might be a Streme-related transfer
        if (event.to && isStremeRelated(event.to)) {
          description = `🟣 Streme stake: ${value || ''}`;
        } else if (event.from && isStremeRelated(event.from)) {
          description = `🟣 Streme unstake: ${value || ''}`;
        }
        
        return description;
      case 'PoolCreated':
        return 'Pool created';
      case 'PoolDistribution':
        const distributionValue = formatEventValue(event);
        return distributionValue ? `Pool distribution: ${distributionValue}` : 'Pool distribution';
      case 'IndexCreated':
        return event.indexId ? `Index ${event.indexId} created` : 'Index created';
      default:
        return formatEventName(event.name);
    }
  };

  const getEventAddresses = (event: TokenEvent) => {
    const addresses: { label: string; address: string }[] = [];
    
    if (event.name === 'Transfer') {
      if (event.from) addresses.push({ label: 'From', address: event.from });
      if (event.to) addresses.push({ label: 'To', address: event.to });
    } else if (event.name === 'FlowUpdated') {
      if (event.sender) addresses.push({ label: 'Sender', address: event.sender });
      if (event.receiver) addresses.push({ label: 'Receiver', address: event.receiver });
    } else if (event.name === 'PoolCreated') {
      if (event.admin) addresses.push({ label: 'Admin', address: event.admin });
      if (event.pool) addresses.push({ label: 'Pool', address: event.pool });
    } else if (event.name === 'PoolDistribution') {
      if (event.pool) addresses.push({ label: 'Pool', address: event.pool });
      if (event.poolMember) addresses.push({ label: 'Member', address: event.poolMember });
    } else if (event.name === 'IndexCreated') {
      if (event.publisher) addresses.push({ label: 'Publisher', address: event.publisher });
    }
    
    return addresses;
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://basescan.org/tx/${txHash}`;
  };

  if (isLoading) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">RECENT EVENTS</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 theme-border mx-auto mb-2"></div>
          <div className="theme-text-muted">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
        <h2 className="text-xl font-bold mb-4 theme-text-primary">RECENT EVENTS</h2>
        <div className="text-center py-8">
          <div className="theme-text-muted mb-2">⚠️</div>
          <div className="theme-text-muted text-sm">
            {error || `No recent events found for ${TOKEN_SYMBOL}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-card-bg theme-border rounded-lg p-6 ${className}`} style={{borderWidth: '1px'}}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold theme-text-primary">RECENT EVENTS</h2>
        <div className="theme-text-secondary text-sm">Last 5 events</div>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="theme-card-bg rounded-lg p-4" style={{opacity: '1'}}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-lg">{getEventIcon(event.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <div className="theme-text-primary font-bold text-sm">
                      {getEventDescription(event)}
                    </div>
                  </div>
                  
                  <div className="theme-text-secondary text-xs mb-2">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  
                  {(() => {
                    const addresses = getEventAddresses(event);
                    return addresses.length > 0 && (
                      <div className="space-y-1">
                        {addresses.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <span className="theme-text-muted text-xs">
                              {item.label}:
                            </span>
                            <button
                              onClick={() => navigator.clipboard.writeText(item.address)}
                              className="theme-text-secondary text-xs hover:theme-text-primary cursor-pointer font-mono"
                              title="Click to copy address"
                            >
                              {shortenAddress(item.address)}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                <a
                  href={getExplorerUrl(event.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="theme-text-primary hover:theme-text-primary text-xs underline"
                  title="View on BaseScan"
                >
                  Block #{parseInt(event.blockNumber).toLocaleString()}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href={`https://basescan.org/token/${TOKEN_ADDRESS}#events`}
          target="_blank"
          rel="noopener noreferrer"
          className="theme-text-primary hover:theme-text-primary text-sm underline"
        >
          View all events on BaseScan →
        </a>
      </div>
    </div>
  );
}
