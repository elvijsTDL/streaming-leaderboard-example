import { TOKEN_SYMBOL } from "../lib/superfluid";

export type PageType = 'stats' | 'leaderboard' | 'streams' | 'events' | 'trading' | 'yoink' | 'wrap' | 'gda-pools';

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const pages = [
    { id: 'stats' as const, label: 'Stats' },
    { id: 'leaderboard' as const, label: 'Leaderboard' },
    { id: 'streams' as const, label: 'Streams' },
    { id: 'events' as const, label: 'Events' },
    { id: 'trading' as const, label: 'Streme' },
    { id: 'yoink' as const, label: 'Yoink - WIP' },
    { id: 'wrap' as const, label: 'Wrap' },
    { id: 'gda-pools' as const, label: 'GDA Pools' },
  ];

  return (
    <header className="theme-card-bg theme-border rounded-xl p-6 mb-8 backdrop-blur-sm" style={{borderWidth: '1px'}}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-col items-center lg:items-start">
          <div className="text-2xl lg:text-3xl font-black theme-text-primary tracking-tight">
            The ${TOKEN_SYMBOL} Token Matrix
          </div>
          <div className="text-sm theme-text-secondary mt-1 font-medium">
          Your one stop shop for all $STREME things          </div>
          <div className="w-16 h-1 theme-button rounded-full mt-2"></div>
        </div>
        
        <nav className="flex flex-wrap justify-center lg:justify-end gap-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`px-4 py-2.5 rounded-lg border transition-all duration-200 font-semibold text-sm min-w-[90px] ${
                currentPage === page.id
                  ? 'theme-button text-black theme-border shadow-lg scale-105'
                  : 'bg-transparent theme-text-primary theme-border hover:theme-button hover:text-black hover:scale-105 hover:shadow-md'
              }`}
              style={{borderWidth: '1px'}}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
