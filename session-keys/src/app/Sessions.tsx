"use client";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  walletActionsErc7715,
  type GrantPermissionsReturnType,
} from "viem/experimental";
import { useWriteContracts } from "wagmi/experimental";
import { ParamCondition } from "@zerodev/permissions/policies";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types";
import { paymasterUrl, tokenAddress, abi } from "./constants";
import {
  Hex,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  http,
  keccak256,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  type Delegation,
  ROOT_AUTHORITY,
  createSessionAccount,
  getDelegationTupleType,
} from "@zerodev/session-account";
import {
  KernelSmartAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { sepolia } from "wagmi/chains";

const BUNDLER_URL = `https://rpc.zerodev.app/api/v2/bundler/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`;
const PAYMASTER_URL = `https://rpc.zerodev.app/api/v2/paymaster/${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}`;

function SessionInfo({
  sessionId,
  privateKey,
  sessionType,
}: {
  sessionId: `0x${string}`;
  privateKey: Hex;
  sessionType: "WALLET" | "ACCOUNT";
}) {
  const { address } = useAccount();
  const { data: hash, writeContracts, isPending, error } = useWriteContracts();
  const [dappManagedTxHash, setDappManagedTxHash] = useState<Hex>();
  const [dappManagedTxIsPending, setDappManagedTxIsPending] = useState(false);

  console.log({ error });

  const sendDappManagedTx = async () => {
    setDappManagedTxIsPending(true);
    const sessionSigner = privateKeyToAccount(privateKey);

    const [delegations, delegatorInitCode] = decodeAbiParameters(
      [getDelegationTupleType(true), { type: "bytes" }],
      sessionId
    );
    const publicClient = createPublicClient({
      transport: http(BUNDLER_URL),
    });
    const sessionAccount = await createSessionAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      sessionKeyAccount: sessionSigner,
      delegations: delegations as Delegation[],
      delegatorInitCode,
    });

    const paymasterClient = createZeroDevPaymasterClient({
      chain: sepolia,
      transport: http(PAYMASTER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    const kernelClient = createKernelAccountClient({
      account:
        sessionAccount as unknown as KernelSmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>,
      chain: sepolia,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      bundlerTransport: http(BUNDLER_URL, { timeout: 100000 }),
      middleware: {
        sponsorUserOperation: paymasterClient.sponsorUserOperation,
      },
    });
    const userOpHash = await kernelClient.sendUserOperation({
      userOperation: {
        callData: await kernelClient.account.encodeCallData({
          to: tokenAddress,
          data: encodeFunctionData({
            abi: abi,
            functionName: "mint",
            args: [address!, BigInt(1)],
          }),
          value: BigInt(0),
        }),
      },
    });
    console.log({ userOpHash });
    setDappManagedTxHash(userOpHash);
    setDappManagedTxIsPending(true);
  };
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
        {sessionType === "WALLET" && (
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
        )}
        {sessionType === "ACCOUNT" && (
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition ease-in-out duration-150"
            disabled={dappManagedTxIsPending}
            onClick={sendDappManagedTx}
          >
            {"Mint With Dapp managed session"}
          </button>
        )}
      </div>
      {(hash || dappManagedTxHash) && (
        <div className="mt-4 text-center text-sm font-medium text-green-600">
          MintWithSession UserOp Hash: {hash ?? dappManagedTxHash}
        </div>
      )}
    </>
  );
}

export default function SessionBlock() {
  const [sessions, setSessions] = useState<GrantPermissionsReturnType[]>([]);
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [isWalletPending, setIsWalletPending] = useState(false);
  const [isAccountPending, setIsAccountPending] = useState(false);
  const [sessionPrivateKey, setSessionPrivateKey] = useState<Hex>();
  const { address } = useAccount();
  const [sessionType, setSessionType] = useState<"WALLET" | "ACCOUNT">();

  const handleWalletTypeIssuePermissions = async () => {
    try {
      setIsWalletPending(true);
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
      setIsWalletPending(false);
      setSessionType("WALLET");
    }
  };

  const handleAccountTypeIssuePermissions = async () => {
    try {
      setIsAccountPending(true);
      const privateKey = generatePrivateKey();
      setSessionPrivateKey(privateKey);
      const sessionAccount = privateKeyToAccount(privateKey);
      const result = await walletClient
        // @ts-ignore
        ?.extend(walletActionsErc7715())
        // @ts-ignore
        .grantPermissions({
          permissions: [],
          signer: {
            type: "account",
            data: {
              id: sessionAccount.address,
            },
          },
          expiry: Math.floor(Date.now().valueOf() / 1000) + 3600,
        });
      console.log(result);
      if (result) setSessions((prev) => [...prev, result]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAccountPending(false);
      setSessionType("ACCOUNT");
    }
  };

  return (
    <>
      <p className="text-xl">Wallet Session</p>
      <button
        className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
          !walletClient || !address ? "opacity-50" : ""
        }`}
        disabled={isWalletPending || !walletClient || !address}
        onClick={() => handleWalletTypeIssuePermissions()}
      >
        {isWalletPending ? "Creating..." : "Create Session"}
      </button>
      <p className="text-xl">Account Session</p>
      <button
        className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
          !walletClient || !address ? "opacity-50" : ""
        }`}
        disabled={isAccountPending || !walletClient || !address}
        onClick={() => handleAccountTypeIssuePermissions()}
      >
        {isAccountPending ? "Creating..." : "Create Session"}
      </button>
      {sessions.map((session, index) => (
        <SessionInfo
          key={index}
          sessionId={session.permissionsContext as `0x${string}`}
          privateKey={sessionPrivateKey!}
          sessionType={sessionType!}
        />
      ))}
    </>
  );
}
