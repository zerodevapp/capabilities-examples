import { parseAbi } from "viem";

if (!process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_ZERODEV_PROJECT_ID");
}

export const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

export const tokenAddress = "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B";

export const abi = parseAbi(["function mint(address _to, uint256 amount) public"]);

export const paymasterUrl = `https://rpc.zerodev.app/api/v3/paymaster/${projectId}`
