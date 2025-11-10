import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster, toast } from 'react-hot-toast'
import { config } from './lib/config'
import { getChainById } from './lib/chains'
import './index.css'
import App from './App.tsx'

// Get chain from environment variable
const chain = getChainById(config.chain.id)

// Create QueryClient instance with global error handler
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred')
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Initialize MSW in development
async function enableMocking() {
  // Only enable MSW if in DEV mode AND not explicitly disabled
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={config.privy.appId}
          config={{
            loginMethods: ['wallet', 'email', 'google'],
            appearance: {
              theme: 'light',
              accentColor: '#676FFF',
            },
            defaultChain: chain,
            supportedChains: [chain],
          }}
        >
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </PrivyProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
