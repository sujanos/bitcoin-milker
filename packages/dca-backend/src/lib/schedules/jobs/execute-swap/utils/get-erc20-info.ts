import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const getErc20Info = async (
  userRpcProvider: ethers.providers.StaticJsonRpcProvider,
  tokenAddress: string
): Promise<{ decimals: ethers.BigNumber; ethersContract: ethers.Contract }> => {
  const contractCode = await userRpcProvider.getCode(tokenAddress);
  if (contractCode === '0x') {
    throw new Error(`No contract code found at ${tokenAddress}`);
  }

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, userRpcProvider);

  return {
    decimals: await tokenContract.decimals(),
    ethersContract: tokenContract,
  };
};
