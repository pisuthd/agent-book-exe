import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@react95/core/GlobalStyle'
import '@rainbow-me/rainbowkit/styles.css'
import '@react95/core/themes/win95.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { AppSettingsProvider } from './context/AppSettingsContext.tsx'
import { wagmiConfig } from './config/wagmi.ts'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppSettingsProvider>
            <App />
          </AppSettingsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)