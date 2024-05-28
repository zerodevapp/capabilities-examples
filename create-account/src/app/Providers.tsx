"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { passkeyConnector, wrapSmartWallet } from "@zerodev/wallet"
import { sepolia } from "viem/chains";
import { http, createConfig, WagmiProvider } from 'wagmi'
import { metaMask } from "wagmi/connectors"

if (!process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_ZERODEV_PROJECT_ID");
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  const PROJECT_ID = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || ""; 

  const config = createConfig({
    chains: [sepolia],
    connectors: [
      wrapSmartWallet(metaMask({
        dappMetadata: {
          name: "ZeroDev Smart Wallet",
        }
      }), PROJECT_ID, "v3"),
      passkeyConnector(PROJECT_ID, sepolia, "v3", "zerodev_quickstart")
    ],
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