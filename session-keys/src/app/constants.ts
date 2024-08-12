import { parseAbi } from "viem";

if (!process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_ZERODEV_PROJECT_ID");
}

export const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

export const tokenAddress = "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B";

export const erc20SpenderAddress= "0x11EAA77621Ba592b9d8658b45Fa42e2d8caa2473"

export const abi = parseAbi(["function mint(address _to, uint256 amount) public"]);

export const paymasterUrl = `https://rpc.zerodev.app/api/v2/paymaster/${projectId}`
