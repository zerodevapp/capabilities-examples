"use client";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  walletActionsErc7715,
  type GrantPermissionsReturnType,
} from "viem/experimental";
import { useWriteContracts } from "wagmi/experimental";
import { ParamCondition } from "@zerodev/permissions/policies";
import { paymasterUrl, tokenAddress, abi } from "./constants";
import { keccak256 } from "viem";

function SessionInfo({ sessionId }: { sessionId: `0x${string}` }) {
  const { address } = useAccount();
  const { data: hash, writeContracts, isPending, error } = useWriteContracts();

  console.log({ error });
  return (
    <>
      <div className="flex flex-col items-center space-y-4 mt-4 px-4">
        {sessionId && (
          <p className="text-sm font-semibold text-white-700 truncate w-full text-center md:text-base lg:text-lg">
            {`Permission ID: ${keccak256(sessionId).slice(0, 10)}...${keccak256(
              sessionId
            ).slice(-3)}`}
          </p>
        )}
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition ease-in-out duration-150"
          disabled={isPending}
          onClick={() => {
            writeContracts({
              contracts: [
                {
                  address: tokenAddress,
                  abi: abi,
                  functionName: "mint",
                  args: [address, 1],
                },
              ],
              capabilities: {
                paymasterService: {
                  url: paymasterUrl,
                },
                permissions: {
                  sessionId: sessionId,
                },
              },
            });
          }}
        >
          {isPending ? "Minting..." : "Mint With Session"}
        </button>
      </div>
      {hash && (
        <div className="mt-4 text-center text-sm font-medium text-green-600">
          MintWithSession UserOp Hash: {hash}
        </div>
      )}
    </>
  );
}

export default function SessionBlock() {
  const [sessions, setSessions] = useState<GrantPermissionsReturnType[]>([]);
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const { address } = useAccount();

  const handleIssuePermissions = async () => {
    try {
      setIsPending(true);
      const result = await walletClient
        // @ts-ignore
        ?.extend(walletActionsErc7715())
        // @ts-ignore
        .grantPermissions({
          permissions: [],
          signer: {
            type: "wallet",
          },
          // permissions: [
          //   {
          //     type: "contract-call",
          //     data: {
          //       // @ts-ignore : The spec is WIP so ignore the type error for now. Below struct is supported.
          //       permissions: [
          //           {
          //             // target address
          //             target: tokenAddress,
          //             // Maximum value that can be transferred.  In this case we
          //             // set it to zero so that no value transfer is possible.
          //             valueLimit: BigInt(0),
          //             // Contract abi
          //             abi: abi,
          //             // Function name
          //             functionName: "mint",
          //             // An array of conditions, each corresponding to an argument for
          //             // the function.
          //             args: [
          //               {
          //                 condition: ParamCondition.EQUAL,
          //                 value: address,
          //               },
          //               {
          //                 condition: ParamCondition.LESS_THAN,
          //                 value: 3,
          //               },
          //             ],
          //           },
          //       ],
          //     },
          //     policies: [
          //       {
          //         type: "rate-limit",
          //         data: {
          //           count: 100,
          //           interval: 60 * 60 * 24
          //         }
          //       }
          //     ],
          //   },
          // ],
          expiry: Math.floor(Date.now().valueOf() / 1000) + 3600,
        });
      console.log(result);
      if (result) setSessions((prev) => [...prev, result]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <p className="text-xl">Session</p>
      <button
        className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
          !walletClient || !address ? "opacity-50" : ""
        }`}
        disabled={isPending || !walletClient || !address}
        onClick={() => handleIssuePermissions()}
      >
        {isPending ? "Creating..." : "Create Session"}
      </button>
      {sessions.map((session, index) => (
        <SessionInfo
          key={index}
          sessionId={session.permissionsContext as `0x${string}`}
        />
      ))}
    </>
  );
}
