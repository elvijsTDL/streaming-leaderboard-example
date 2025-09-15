import { TOKEN_ADDRESS } from "../../lib/superfluid";
import { WrapTokenCard } from "../wrap-token-card";

export function WrapPage() {
  return (
    <div className="space-y-6">
      <WrapTokenCard initialToken={TOKEN_ADDRESS as `0x${string}`} />
    </div>
  );
}



