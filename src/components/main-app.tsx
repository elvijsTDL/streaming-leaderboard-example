"use client";

import { useState } from "react";
import { FarcasterProvider } from "../hooks/use-farcaster";

import { Navigation, type PageType } from "./navigation";
import { DashboardPage } from "./pages/dashboard-page";
import { LeaderboardPage } from "./pages/leaderboard-page";
import { StreamsPage } from "./pages/streams-page";
import { EventsPage } from "./pages/events-page";
import { AnalyticsPage } from "./pages/analytics-page";
import { YoinkPage } from "./pages/yoink-page";
import { WrapPage } from "./pages/wrap-page";

function MainView() {
  const [currentPage, setCurrentPage] = useState<PageType>('stats');



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
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text-primary font-mono">
      <div className="container mx-auto px-4 py-8">
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
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


