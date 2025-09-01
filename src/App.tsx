import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import MainApp from "./components/main-app";
import { TOKEN_SYMBOL } from "./lib/superfluid";

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
    sdk.actions.addMiniApp();
    
    document.title = `Everything $${TOKEN_SYMBOL}`;
  }, []);

  return <MainApp />;
}
