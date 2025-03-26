import consola from 'consola';
import { ethers } from 'ethers';
import { Types } from 'mongoose';

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from '@lit-protocol/constants';

import { getTopBaseMemeCoin } from './baseMemeCoinLoader';
import { getEthereumPriceUsd } from './ethPriceLoader';
import { env } from '../../../env';
import { getLitContractsInstance } from '../../../LitContracts/getLitContracts';
import { getLitNodeClientInstance } from '../../../LitNodeClient/getLitNodeClient';
import { PurchasedCoin } from '../../../mongo/models/PurchasedCoin';
import { Schedule } from '../../../mongo/models/Schedule';

export interface ExecuteSwapParams {
  scheduleId: Types.ObjectId;
}

const { BASE_RPC_URL, VINCENT_DELEGATEE_PRIVATE_KEY, VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID } = env;

export type CapacityToken = {
  URI: { description: string; image_data: string; name: string };
  capacity: {
    expiresAt: { formatted: string; timestamp: number };
    requestsPerMillisecond: number;
  };
  isExpired: boolean;
  tokenId: number;
};

async function executeSwap({ scheduleId }: ExecuteSwapParams): Promise<void> {
  // Fetch top coin first to get the target token
  consola.debug('Fetching top coin...');
  const topCoin = await getTopBaseMemeCoin();
  consola.debug('Got top coin:', topCoin);

  const ethPriceUsd = await getEthereumPriceUsd();

  const schedule = await Schedule.findById(scheduleId).orFail().lean();

  const { purchaseAmount, walletAddress } = schedule;

  // Calculate dollar value of the transaction
  const purchaseAmountWei = ethers.utils.parseEther(purchaseAmount);
  const purchaseAmountEth = parseFloat(ethers.utils.formatEther(purchaseAmountWei));
  const purchaseAmountUsd = purchaseAmountEth * ethPriceUsd;

  consola.debug(
    `Transaction value: $${purchaseAmountUsd.toFixed(2)} USD (${purchaseAmountEth} ETH at $${ethPriceUsd.toFixed(2)}/ETH)`
  );

  // Check user's wallet balance
  const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
  const userWalletBalance = await provider.getBalance(walletAddress);
  const userBalanceEth = parseFloat(ethers.utils.formatEther(userWalletBalance));
  const userBalanceUsd = userBalanceEth * ethPriceUsd;

  // Add some buffer for gas fees (approximately 10%)
  const estimatedGasFee = purchaseAmountWei.mul(10).div(100);
  const estimatedGasFeeEth = parseFloat(ethers.utils.formatEther(estimatedGasFee));
  const estimatedGasFeeUsd = estimatedGasFeeEth * ethPriceUsd;

  const totalRequiredWei = purchaseAmountWei.add(estimatedGasFee);
  const totalRequiredUsd = purchaseAmountUsd + estimatedGasFeeUsd;

  if (userWalletBalance.lt(totalRequiredWei)) {
    consola.error(
      `Insufficient balance in user wallet ${walletAddress}: ` +
        `${userBalanceEth.toFixed(6)} ETH ($${userBalanceUsd.toFixed(2)} USD). ` +
        `Required for purchase: ${purchaseAmountEth.toFixed(6)} ETH ($${purchaseAmountUsd.toFixed(2)} USD) ` +
        `plus estimated gas: ${estimatedGasFeeEth.toFixed(6)} ETH ($${estimatedGasFeeUsd.toFixed(2)} USD). ` +
        `Total required: $${totalRequiredUsd.toFixed(2)} USD.`
    );
    throw new Error(`Insufficient balance in user wallet to purchase ${topCoin.symbol}`);
  }

  const ethersSigner = new ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  );

  const litContractClient = await getLitContractsInstance({ network: LIT_NETWORK.Datil });

  // Check if the service wallet has sufficient balance before proceeding
  const walletBalance = await ethersSigner.getBalance();
  const minRequiredBalance = ethers.utils.parseEther('0.01'); // Set a minimum required balance threshold

  if (walletBalance.lt(minRequiredBalance)) {
    consola.error(
      `Insufficient balance to execute swap: ${ethers.utils.formatEther(walletBalance)} ETH. ` +
        `Minimum required: ${ethers.utils.formatEther(minRequiredBalance)} ETH.`
    );
    throw new Error(`Insufficient balance in service wallet to purchase ${topCoin.symbol}`);
  }

  const RLITokens: CapacityToken[] =
    await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
      ethersSigner.address
    );

  const unexpiredToken = RLITokens.find((token) => !token.isExpired);

  if (!unexpiredToken) {
    consola.error('No unexpired RLI token found for service wallet');
    throw new Error('No unexpired RLI token found for service wallet');
  }

  const litNodeClient = await getLitNodeClientInstance({ network: LIT_NETWORK.Datil });

  const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
    capacityTokenId: String(unexpiredToken.tokenId),
    dAppOwnerWallet: ethersSigner,
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    uses: '1',
  });

  const sessionSigs = await litNodeClient.getSessionSigs({
    // 24 hours
    capabilityAuthSigs: [capacityDelegationAuthSig],

    authNeededCallback: async ({ expiration, resourceAbilityRequests, uri }) => {
      const toSign = await createSiweMessageWithRecaps({
        litNodeClient,
        expiration: expiration!,
        nonce: await litNodeClient.getLatestBlockhash(),
        resources: resourceAbilityRequests!,
        uri: uri!,
        walletAddress: ethersSigner.address,
      });

      return generateAuthSig({
        toSign,
        signer: ethersSigner,
      });
    },
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resourceAbilityRequests: [
      {
        ability: LIT_ABILITY.LitActionExecution,
        resource: new LitActionResource('*'),
      },
    ],
  });

  const litActionResponse = await litNodeClient.executeJs({
    sessionSigs,
    ipfsId: VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID,
    jsParams: {
      litActionParams: {
        amountIn: purchaseAmount,
        chainId: '8453',
        pkpEthAddress: walletAddress,
        rpcUrl: BASE_RPC_URL,
        tokenIn: '0x4200000000000000000000000000000000000006',
        // Wrapped ETH
        tokenOut: topCoin.coinAddress,
      },
    },
  });

  consola.debug('Lit Action Response:', litActionResponse);

  const swapResult = JSON.parse(litActionResponse.response as string);
  const success = swapResult.status === 'success';

  // Create a purchase record with all required fields
  const purchase = new PurchasedCoin({
    purchaseAmount,
    schedule,
    success,
    walletAddress,
    coinAddress: topCoin.coinAddress,
    name: topCoin.name,
    price: topCoin.price,
    symbol: topCoin.symbol,
    txHash: swapResult.swapHash,
  });
  await purchase.save();

  consola.debug(
    `Successfully created purchase record for ${topCoin.symbol} with tx hash ${swapResult.swapHash}`
  );
}

export const jobName = 'execute-swap';
export const processJob = executeSwap;
