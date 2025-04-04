import { ethers } from 'ethers';

import { LIT_RPC } from '@lit-protocol/constants';
import { getVincentToolClient } from '@lit-protocol/vincent-sdk';

import { env } from '../../../env';

const { ERC20_APPROVAL_TOOL_IPFS_ID, UNISWAP_SWAP_TOOL_IPFS_ID, VINCENT_DELEGATEE_PRIVATE_KEY } =
  env;

export const ethersSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
);

export const erc20ApprovalToolClient = getVincentToolClient({
  ethersSigner,
  vincentToolCid: ERC20_APPROVAL_TOOL_IPFS_ID,
});

export const uniswapToolClient = getVincentToolClient({
  ethersSigner,
  vincentToolCid: UNISWAP_SWAP_TOOL_IPFS_ID,
});
