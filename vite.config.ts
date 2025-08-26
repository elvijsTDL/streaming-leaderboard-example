import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api/whois": {
        target: "https://whois.superfluid.finance",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whois/, "/api"),
      },
      "/api/streme": {
        target: "https://streme.fun",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/streme/, "/api"),
      },
      "/api/uniswap": {
        target: "https://interface.gateway.uniswap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/uniswap/, "/v1"),
      },
    },
  },
});
