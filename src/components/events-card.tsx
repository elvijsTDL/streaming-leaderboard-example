import { useEffect, useState } from "react";
import { fetchTokenEvents, type TokenEvent, TOKEN_ADDRESS, TOKEN_SYMBOL } from "../lib/superfluid";
import { shortenAddress } from "../lib/utils";

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
        const tokenEvents = await fetchTokenEvents(TOKEN_ADDRESS, 10);
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
    const name = eventName.toLowerCase();
    if (name.includes('flow') || name.includes('stream')) return '🌊';
    if (name.includes('transfer')) return '💸';
    if (name.includes('approval')) return '✅';
    if (name.includes('pool') || name.includes('gda')) return '🏊';
    if (name.includes('upgrade')) return '⬆️';
    if (name.includes('agreement')) return '🤝';
    return '📅';
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
        <div className="theme-text-secondary text-sm">Last 10 events</div>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={event.id} className="theme-card-bg rounded-lg p-4" style={{opacity: '1'}}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-lg">{getEventIcon(event.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="theme-text-primary font-bold text-sm">
                      {formatEventName(event.name)}
                    </div>
                    <div className="w-4 h-4 rounded theme-button flex items-center justify-center theme-text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="theme-text-secondary text-xs mb-2">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  
                  {event.addresses && event.addresses.length > 0 && (
                    <div className="space-y-1">
                      {event.addresses.slice(0, 2).map((address, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="theme-text-muted text-xs">
                            {i === 0 ? 'From:' : 'To:'}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(address)}
                            className="theme-text-secondary text-xs hover:theme-text-primary cursor-pointer font-mono"
                            title="Click to copy address"
                          >
                            {shortenAddress(address)}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
