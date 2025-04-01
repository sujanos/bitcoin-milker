import { ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';

export const getEthUsdPrice = async (): Promise<ethers.BigNumber> => {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    // From lit-assets rpc.ci.yml
    'https://mainnet.infura.io/v3/cf01b9202dde482e8ce2aaa92289ea24'
  );

  const { ETH_USD_CHAINLINK_FEED } = getAddressesByChainId('1');

  const CHAINLINK_AGGREGATOR_ABI = [
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  ];

  const aggregator = new ethers.Contract(
    ETH_USD_CHAINLINK_FEED!,
    CHAINLINK_AGGREGATOR_ABI,
    provider
  );
  const roundData = await aggregator.latestRoundData();
  const price = ethers.BigNumber.from(roundData.answer);

  return price;
};
