"use client";
import { parseAbi } from "viem";
import { useConnect, useAccount, useDisconnect, useConnectors } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";

export default function App() {
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data, writeContracts, isPending: isUserOpPending } = useWriteContracts();

  const tokenAddress = "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B";
  const abi = parseAbi(["function mint(address _to, uint256 amount) public"]);
  const paymasterUrl = `https://rpc.zerodev.app/api/v3/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`

  return (
    <div className="flex justify-center items-center h-screen">
      {!isConnected ? (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          disabled={isPending}
          onClick={() => {
            connect({ connector: connectors[0] })
          }}
        >
          {isPending ? 'Connecting...' : 'Connect'}
        </button>
      ) : (
        <div className="flex flex-col justify-center items-center h-screen">
          <p>{`Smart Account Address: ${address}`}</p>
          <div className="flex flex-row justify-center items-center gap-4">  {/* Updated line */}
            <button onClick={() => disconnect()} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
              Disconnect
            </button>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg" 
              disabled={isUserOpPending}
              onClick={() => {
                writeContracts({
                  contracts: [
                    {
                      address: tokenAddress,
                      abi: abi,
                      functionName: "mint",
                      args: [address, 1],
                      value: BigInt(0),
                    }
                  ],
                  capabilities: {
                    paymasterService: {
                      url: paymasterUrl
                    }
                  }
                })
              }}
            >
              {isUserOpPending ? 'Minting...' : 'Mint'}
            </button>
          </div>
          {data && <p>{`UserOp Hash: ${data}`}</p>}
        </div>    
      )}  
    </div>
  );
}
