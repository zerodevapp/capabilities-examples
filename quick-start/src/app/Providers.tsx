"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { passkeyConnector } from "@zerodev/wallet"
import { sepolia } from "viem/chains";
import { http, createConfig, WagmiProvider } from 'wagmi'

if (!process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_ZERODEV_PROJECT_ID");
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  const PROJECT_ID = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || ""; 

  const config = createConfig({
    chains: [sepolia],
    connectors: [passkeyConnector(PROJECT_ID, sepolia, "v3", "zerodev_quickstart")],
    transports: {
      [sepolia.id]: http(),
    },
  })
   
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}