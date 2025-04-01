/* eslint-disable no-console */

import { ethers } from 'ethers';

export const validateSpendingLimits = async (
  appId: string,
  amountInUsd: ethers.BigNumber,
  maxAmountPerTx: ethers.BigNumber
): Promise<void> => {
  const CHAINLINK_USD_DECIMALS = 8;

  // Check amount limit
  console.log(
    `Checking if USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_USD_DECIMALS).padEnd(10, '0')} exceeds maxAmountPerTx $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_USD_DECIMALS).padEnd(10, '0')}...`
  );

  if (amountInUsd.gt(maxAmountPerTx)) {
    throw new Error(
      `USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_USD_DECIMALS).padEnd(10, '0')} exceeds the maximum amount $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_USD_DECIMALS).padEnd(10, '0')} allowed for App ID: ${appId} per transaction`
    );
  }
};
