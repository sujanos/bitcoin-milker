/* eslint-disable no-console */
import { Contract, ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export async function getExistingAllowance(
  chainId: string,
  wethContract: Contract,
  userAddress: string
): Promise<ethers.BigNumber> {
  const { UNISWAP_V3_ROUTER } = getAddressesByChainId(String(chainId));

  const currentAllowance = await wethContract.allowance(userAddress, UNISWAP_V3_ROUTER);
  console.log(`Current router allowance: ${ethers.utils.formatEther(currentAllowance)} WETH`);

  return currentAllowance;
}

export function getERC20Contract(address: string, provider: ethers.providers.JsonRpcProvider) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}
