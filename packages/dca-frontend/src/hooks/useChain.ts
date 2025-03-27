import { useMemo, useState } from 'react';
import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { LITEVMChain } from '@lit-protocol/types';
import { ethers } from 'ethers';

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

const WETH_CONTRACT_ADDRESSES: Record<number, string> = {
  [LIT_EVM_CHAINS.base.chainId]: '0x4200000000000000000000000000000000000006',
  [LIT_EVM_CHAINS.baseSepolia.chainId]: '0x4200000000000000000000000000000000000006',
  [LIT_EVM_CHAINS.arbitrum.chainId]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  [LIT_EVM_CHAINS.optimism.chainId]: '0x4200000000000000000000000000000000000006',
  [LIT_EVM_CHAINS.polygon.chainId]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

export const useChain = () => {
  const [chain, setChain] = useState<LITEVMChain>(LIT_EVM_CHAINS.base);

  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]), [chain]);
  const wethContract = useMemo(
    () => new ethers.Contract(WETH_CONTRACT_ADDRESSES[chain.chainId], ERC20_ABI, provider),
    [chain, provider]
  );

  return {
    chain,
    setChain,
    provider,
    wethContract,
  };
};
