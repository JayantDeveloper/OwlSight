import { createConfig, http } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const isValidWcProjectId = wcProjectId && wcProjectId !== "demo" && wcProjectId.length > 8;

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(isValidWcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
