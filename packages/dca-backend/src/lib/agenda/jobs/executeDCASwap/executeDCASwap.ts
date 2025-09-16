import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { Coin, getTopBaseMemeCoin } from './baseMemeCoinLoader';
import { getEthereumPriceUsd } from './ethPriceLoader';
import { handleOperationExecution } from './utils';
import {
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
} from './utils/alchemy';
import { getERC20Contract } from './utils/get-erc20-info';
import {
  getErc20ApprovalToolClient,
  getSignedUniswapQuote,
  getUniswapToolClient,
} from './vincentAbilities';
import { env } from '../../../env';
import { PurchasedCoin } from '../../../mongo/models/PurchasedCoin';

export type AppData = {
  id: number;
  version: number;
};

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  name: string;
  pkpInfo: IRelayPKP;
  purchaseAmount: number;
  purchaseIntervalHuman: string;
  updatedAt: Date;
};

const { BASE_RPC_URL } = env;

const BASE_CHAIN_ID = 8453;
const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const BASE_UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL);
const wethContract = getERC20Contract(BASE_WETH_ADDRESS, baseProvider);

async function addWethApproval({
  ethAddress,
  wethAmount,
}: {
  ethAddress: `0x${string}`;
  wethAmount: ethers.BigNumber;
}): Promise<`0x${string}` | undefined> {
  const erc20ApprovalToolClient = getErc20ApprovalToolClient();
  const approvalParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    chainId: BASE_CHAIN_ID,
    rpcUrl: BASE_RPC_URL,
    spenderAddress: BASE_UNISWAP_V3_ROUTER,
    tokenAddress: BASE_WETH_ADDRESS,
    tokenAmount: wethAmount.mul(5).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
  };
  const approvalContext = {
    delegatorPkpEthAddress: ethAddress,
  };

  // Running precheck to prevent sending approval tx if not needed or will fail
  const approvalPrecheckResult = await erc20ApprovalToolClient.precheck(
    approvalParams,
    approvalContext
  );
  if (!approvalPrecheckResult.success) {
    throw new Error(`ERC20 approval tool precheck failed: ${approvalPrecheckResult}`);
  } else if (approvalPrecheckResult.result.alreadyApproved) {
    // No need to send tx, allowance is already at that amount
    return undefined;
  }

  // Sending approval tx
  const approvalExecutionResult = await erc20ApprovalToolClient.execute(
    approvalParams,
    approvalContext
  );
  consola.trace('ERC20 Approval Vincent Tool Response:', approvalExecutionResult);
  if (!approvalExecutionResult.success) {
    throw new Error(`ERC20 approval tool execution failed: ${approvalExecutionResult}`);
  }

  return approvalExecutionResult.result.approvalTxHash as `0x${string}`;
}

async function handleSwapExecution({
  ethAddress,
  topCoin,
  wethAmount,
}: {
  ethAddress: `0x${string}`;
  topCoin: Coin;
  wethAmount: ethers.BigNumber;
}): Promise<`0x${string}`> {
  const signedUniswapQuote = await getSignedUniswapQuote({
    recipient: ethAddress,
    rpcUrl: BASE_RPC_URL,
    tokenInAddress: BASE_WETH_ADDRESS,
    tokenInAmount: wethAmount.toString(),
    tokenOutAddress: topCoin.coinAddress,
  });

  const uniswapToolClient = getUniswapToolClient();
  const swapParams = {
    signedUniswapQuote,
    rpcUrlForUniswap: BASE_RPC_URL,
  };
  const swapContext = {
    delegatorPkpEthAddress: ethAddress,
  };

  const swapPrecheckResult = await uniswapToolClient.precheck(swapParams, swapContext);
  if (!swapPrecheckResult.success) {
    throw new Error(`Uniswap tool precheck failed: ${swapPrecheckResult}`);
  }

  const swapExecutionResult = await uniswapToolClient.execute(swapParams, swapContext);
  consola.trace('Uniswap Swap Vincent Tool Response:', swapExecutionResult);
  if (!swapExecutionResult.success) {
    throw new Error(`Uniswap tool execution failed: ${swapExecutionResult}`);
  }

  return swapExecutionResult.result.swapTxHash as `0x${string}`;
}

export async function executeDCASwap(job: JobType): Promise<void> {
  try {
    const {
      _id,
      data: {
        pkpInfo: { ethAddress, publicKey },
        purchaseAmount,
      },
    } = job.attrs;

    consola.log('Starting DCA swap job...', {
      _id,
      ethAddress,
      purchaseAmount,
    });

    consola.debug('Fetching top coin, WETH balance and ETHUSD price...');
    const [topCoin, wEthBalance, ethPriceUsd] = await Promise.all([
      getTopBaseMemeCoin(),
      wethContract.balanceOf(ethAddress),
      getEthereumPriceUsd(),
    ]);
    consola.debug('Got top coin:', topCoin);

    if (!wEthBalance.gt(0)) {
      throw new Error(
        `No wEth balance for account ${ethAddress} - please fund this account with WETH to swap`
      );
    }

    const wethAmount = ethers.utils.parseEther((purchaseAmount / ethPriceUsd).toFixed(18));

    consola.log('Job details', {
      ethAddress,
      ethPriceUsd,
      purchaseAmount,
      wethAmount,
    });

    const approvalHash = await addWethApproval({
      wethAmount,
      ethAddress: ethAddress as `0x${string}`,
    });

    if (approvalHash) {
      await handleOperationExecution({
        isSponsored: alchemyGasSponsor,
        operationHash: approvalHash,
        pkpPublicKey: publicKey,
        provider: baseProvider,
      });
    }

    const swapHash = await handleSwapExecution({
      topCoin,
      wethAmount,
      ethAddress: ethAddress as `0x${string}`,
    });

    // Create a purchase record with all required fields
    const purchase = new PurchasedCoin({
      ethAddress,
      coinAddress: topCoin.coinAddress,
      name: topCoin.name,
      purchaseAmount: purchaseAmount.toFixed(2),
      purchasePrice: topCoin.price,
      scheduleId: _id,
      symbol: topCoin.symbol,
      txHash: swapHash,
    });
    await purchase.save();

    consola.debug(
      `Successfully created purchase record for ${topCoin.symbol} with tx hash ${swapHash}`
    );
  } catch (e) {
    // Catch-and-rethrow is usually an antipattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = e as Error;
    consola.error(err.message, err.stack);
    throw e;
  }
}
