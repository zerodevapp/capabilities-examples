"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { passkeyConnector } from "@zerodev/wallet"
import { sepolia } from "viem/chains";
import { http, createConfig, WagmiProvider } from 'wagmi'
import { projectId } from "./constants"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  const config = createConfig({
    // @ts-ignore
    chains: [sepolia],
    // @ts-ignore
    connectors: [passkeyConnector(projectId, sepolia, "v3.1", "zerodev_quickstart")],
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