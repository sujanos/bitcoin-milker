/* eslint-disable */
import { ethers } from 'ethers';

export const validateTokenAreAllowed = (tokens: string[], allowedTokens: string[]): void => {
  if (allowedTokens.length > 0) {
    for (const token of tokens) {
      if (!allowedTokens.includes(ethers.utils.getAddress(token))) {
        throw new Error(
          `Token ${ethers.utils.getAddress(token)} is not allowed for input. Allowed tokens: ${allowedTokens.join(', ')}`
        );
      }
    }
  }
};
