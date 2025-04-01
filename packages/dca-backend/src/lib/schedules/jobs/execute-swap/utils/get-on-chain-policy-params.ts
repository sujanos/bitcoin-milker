/* eslint-disable */
import { ethers } from 'ethers';

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export const getOnChainPolicyParams = (parameters: PolicyParameter[]) => {
  let maxAmountPerTx: ethers.BigNumber | undefined;
  let maxSpendingLimit: ethers.BigNumber | undefined;
  let spendingLimitDuration: ethers.BigNumber | undefined;
  let allowedTokens: string[] | undefined;

  for (const parameter of parameters) {
    switch (parameter.name) {
      case 'maxAmountPerTx':
        // Parameter type 2 = UINT256
        if (parameter.paramType === 2) {
          maxAmountPerTx = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
        } else {
          throw new Error(`Unexpected parameter type for maxAmountPerTx: ${parameter.paramType}`);
        }
        break;
      case 'maxSpendingLimit':
        // Parameter type 2 = UINT256
        if (parameter.paramType !== 2) {
          throw new Error(`Unexpected parameter type for maxSpendingLimit: ${parameter.paramType}`);
        }

        maxSpendingLimit = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];

        // Find the corresponding spending limit duration parameter
        const durationParam = parameters.find((p) => p.name === 'spendingLimitDuration');
        if (!durationParam) {
          throw new Error(
            'spendingLimitDuration not found in policy parameters, but required when maxSpendingLimit is set'
          );
        }

        if (durationParam.paramType !== 2) {
          throw new Error(
            `Unexpected parameter type for spendingLimitDuration: ${durationParam.paramType}`
          );
        }

        spendingLimitDuration = ethers.utils.defaultAbiCoder.decode(
          ['uint256'],
          durationParam.value
        )[0];
        break;
      case 'allowedTokens':
        // Parameter type 7 = ADDRESS_ARRAY
        if (parameter.paramType === 7) {
          allowedTokens = ethers.utils.defaultAbiCoder.decode(['address[]'], parameter.value)[0];
        } else {
          throw new Error(`Unexpected parameter type for allowedTokens: ${parameter.paramType}`);
        }
        break;
    }
  }

  return { maxAmountPerTx, maxSpendingLimit, spendingLimitDuration, allowedTokens };
};
