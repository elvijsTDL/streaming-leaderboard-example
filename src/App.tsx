import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import MainApp from "./components/main-app";

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <MainApp />;
}
