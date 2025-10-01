"use client";

import { useState, useEffect } from "react";
import { FarcasterProvider } from "../hooks/use-farcaster";

import { Navigation, type PageType } from "./navigation";
import { DashboardPage } from "./pages/dashboard-page";
import { LeaderboardPage } from "./pages/leaderboard-page";
import { StreamsPage } from "./pages/streams-page";
import { EventsPage } from "./pages/events-page";
import { AnalyticsPage } from "./pages/analytics-page";
import { YoinkPage } from "./pages/yoink-page";
import { WrapPage } from "./pages/wrap-page";
import { GDAPoolsPage } from "./pages/gda-pools-page";
import { CHAIN_ID } from "../lib/superfluid";

function MainView() {
  const [currentPage, setCurrentPage] = useState<PageType>('stats');
  const isBaseNetwork = CHAIN_ID === 8453;

  // Handle page changes and redirect away from trading page if not on Base
  const handlePageChange = (page: PageType) => {
    if (page === 'trading' && !isBaseNetwork) {
      // Redirect to stats page if trying to access trading on non-Base network
      setCurrentPage('stats');
      return;
    }
    setCurrentPage(page);
  };

  // If currently on trading page but not on Base network, redirect to stats
  useEffect(() => {
    if (currentPage === 'trading' && !isBaseNetwork) {
      setCurrentPage('stats');
    }
  }, [currentPage, isBaseNetwork]);



  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'stats':
        return <DashboardPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'streams':
        return <StreamsPage />;
      case 'events':
        return <EventsPage />;
      case 'trading':
        return <AnalyticsPage />;
      case 'yoink':
        return <YoinkPage />;
      case 'wrap':
        return <WrapPage />;
      case 'gda-pools':
        return <GDAPoolsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text-primary font-mono">
      <div className="container mx-auto px-4 py-8">
        <Navigation 
          currentPage={currentPage} 
          onPageChange={handlePageChange} 
        />   
        {renderCurrentPage()}
      </div>
    </div>
  );
}

export default function MainApp() {
  return (
    <FarcasterProvider>
      <MainView />
    </FarcasterProvider>
  );
}


