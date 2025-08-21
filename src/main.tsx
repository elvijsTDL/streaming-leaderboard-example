import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import { wagmiAdapter, projectId } from "./wagmi";

import App from "./App.tsx";

import "./index.css";

// Initialize AppKit modal (registers web components like <appkit-button />)
if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn("Reown: VITE_REOWN_PROJECT_ID is not set. AppKit will not connect to Cloud features.");
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || "", // allow local dev without crashing
  networks: [base],
  defaultNetwork: base,
  metadata: {
    name: "Streaming Leaderboard",
    description: "Streaming Leaderboard Example",
    url: window.location.origin,
    icons: [
      new URL("/placeholder.svg", window.location.origin).toString(),
    ],
  },
  features: {
    analytics: true,
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
