import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'nes.css/css/nes.min.css'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/theme/ThemeProvider.tsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";

const queryClient = new QueryClient();
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

if (!privyAppId) {
  throw new Error("VITE_PRIVY_APP_ID is required to initialize PrivyProvider");
}

const rpcUrl = import.meta.env.VITE_RPC_URL;
const chainId = Number(import.meta.env.VITE_CHAIN_ID);

const customChain = {
  id: chainId || 43522,
  name: 'MemeCore',
  network: 'memecore',
  nativeCurrency: {
    decimals: 18,
    name: 'Meme',
    symbol: 'M',
  },
  rpcUrls: {
    default: {
      http: [rpcUrl || 'https://rpc.insectarium.memecore.net'],
    },
    public: {
      http: [rpcUrl || 'https://rpc.insectarium.memecore.net'],
    },
  },
} as any;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          supportedChains: [customChain],
        }}
      >
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PrivyProvider>
    </QueryClientProvider>
  </StrictMode>,
)
