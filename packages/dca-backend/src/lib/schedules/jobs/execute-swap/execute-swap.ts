import consola from 'consola';
import { ethers } from 'ethers';
import { Types } from 'mongoose';

import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigsMap } from '@lit-protocol/types';

import { Coin, getTopBaseMemeCoin } from './baseMemeCoinLoader';
import { getEthereumPriceUsd } from './ethPriceLoader';
import { getSessionSigs } from './getSessionSigs';
import {
  getAddressesByChainId,
  getErc20Info,
  getEstimatedGasForApproval,
  getEstimatedUniswapCosts,
} from './utils';
import { getERC20Contract, getExistingUniswapAllowance } from './utils/get-erc20-info';
import { env } from '../../../env';
import { getLitNodeClientInstance } from '../../../LitNodeClient/getLitNodeClient';
import { PurchasedCoin } from '../../../mongo/models/PurchasedCoin';
import { Schedule } from '../../../mongo/models/Schedule';

export interface ExecuteSwapParams {
  scheduleId: Types.ObjectId;
}

const { BASE_RPC_URL, VINCENT_TOOL_APPROVAL_IPFS_ID, VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID } = env;

const BASE_CHAIN_ID = '8453';

async function addApproval({
  baseProvider,
  litNodeClient,
  nativeEthBalance,
  sessionSigs,
  walletAddress,
  WETH_ADDRESS,
  wEthDecimals,
  wethToSpend,
}: {
  WETH_ADDRESS: string;
  baseProvider: ethers.providers.StaticJsonRpcProvider;
  litNodeClient: LitNodeClient;
  nativeEthBalance: ethers.BigNumber;
  sessionSigs: SessionSigsMap;
  wEthDecimals: ethers.BigNumber;
  walletAddress: string;
  wethToSpend: ethers.BigNumber;
}): Promise<ethers.BigNumber> {
  const approvalGasCost = await getEstimatedGasForApproval(
    baseProvider,
    BASE_CHAIN_ID,
    WETH_ADDRESS!,
    wethToSpend.mul(5).toString(),
    wEthDecimals.toString(),
    walletAddress
  );

  const requiredApprovalGasCost = approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas);

  consola.log('requiredApprovalGasCost', requiredApprovalGasCost);

  if (nativeEthBalance.lt(requiredApprovalGasCost)) {
    throw new Error(
      `Not enough ETH to pay for gas for token approval - balance is ${nativeEthBalance.toString()}, needed ${requiredApprovalGasCost.toString()}`
    );
  }

  const litActionResponse = await litNodeClient.executeJs({
    sessionSigs,
    ipfsId: VINCENT_TOOL_APPROVAL_IPFS_ID,
    jsParams: {
      toolParams: {
        amountIn: wethToSpend.mul(5).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
        chainId: BASE_CHAIN_ID,
        pkpEthAddress: walletAddress,
        rpcUrl: BASE_RPC_URL,
        tokenIn: WETH_ADDRESS!,
      },
    },
  });

  consola.debug('Approval LIT Action Response:', litActionResponse);

  return approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas);
}

async function executeSwap({ scheduleId }: ExecuteSwapParams): Promise<void> {
  try {
    // Fetch top coin first to get the target token
    consola.debug('Fetching top coin...');
    const topCoin = (await getTopBaseMemeCoin()) as unknown as Coin;
    consola.debug('Got top coin:', topCoin);

    const schedule = await Schedule.findById(scheduleId).orFail().lean();

    const { purchaseAmount, walletAddress } = schedule;

    // FIXME: This should be type-safe
    const { WETH_ADDRESS } = getAddressesByChainId(BASE_CHAIN_ID);

    const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL);

    const wethContract = getERC20Contract(WETH_ADDRESS!, baseProvider);

    const [
      wEthDecimals,
      wEthBalance,
      tokenOutInfo,
      ethPriceUsd,
      existingAllowance,
      nativeEthBalance,
    ] = await Promise.all([
      wethContract.decimals(),
      wethContract.balanceOf(walletAddress),
      getErc20Info(baseProvider, topCoin.coinAddress),
      getEthereumPriceUsd(),
      getExistingUniswapAllowance(
        BASE_CHAIN_ID,
        getERC20Contract(WETH_ADDRESS!, baseProvider),
        walletAddress
      ),
      baseProvider.getBalance(walletAddress),
    ]);

    if (!nativeEthBalance.gt(0)) {
      throw new Error(
        `No native eth balance on account ${walletAddress} - please fund this account with ETH to pay for gas`
      );
    }

    if (!wEthBalance.gt(0)) {
      throw new Error(
        `No wEth balance for account ${walletAddress} - please fund this account with WETH to swap`
      );
    }

    const usdAmountStr = purchaseAmount.toString();
    const wethPriceStr = ethPriceUsd.toString();

    const wethAmount = parseFloat(usdAmountStr) / parseFloat(wethPriceStr);
    const wethToSpend = ethers.utils.parseEther(wethAmount.toFixed(18));

    consola.log('Job details', {
      ethPriceUsd,
      existingAllowance,
      purchaseAmount,
      usdAmountStr,
      walletAddress,
      wethAmount,
      wethPriceStr,
      nativeEthBalance: nativeEthBalance.toString(),
      wethToSpend: wethToSpend.toString(),
    });

    const needsApproval = existingAllowance.lte(wethToSpend);

    const litNodeClient = await getLitNodeClientInstance({ network: LIT_NETWORK.Datil });

    const sessionSigs = await getSessionSigs({ litNodeClient });

    let approvalGasCost = ethers.BigNumber.from(0);

    if (needsApproval) {
      approvalGasCost = await addApproval({
        WETH_ADDRESS: WETH_ADDRESS!,
        // eslint-disable-next-line sort-keys-plus/sort-keys
        baseProvider,
        litNodeClient,
        nativeEthBalance,
        sessionSigs,
        walletAddress,
        wEthDecimals,
        wethToSpend,
      });
    }

    const { gasCost, swapCost } = await getEstimatedUniswapCosts({
      amountIn: wethAmount.toFixed(18).toString(),
      pkpEthAddress: walletAddress,
      tokenInAddress: WETH_ADDRESS!,
      tokenInDecimals: wEthDecimals,
      tokenOutAddress: topCoin.coinAddress,
      tokenOutDecimals: tokenOutInfo.decimals,
      userChainId: BASE_CHAIN_ID,
      userRpcProvider: baseProvider,
    });

    if (swapCost.amountOutMin.gt(wEthBalance)) {
      throw new Error(
        `Not enough WETH to swap - balance is ${wEthBalance.toString()}, needed ${swapCost.amountOutMin.toString()}`
      );
    }

    const requiredSwapGasCost = gasCost.estimatedGas.mul(gasCost.maxFeePerGas);
    if (!nativeEthBalance.sub(approvalGasCost).gte(requiredSwapGasCost)) {
      throw new Error(
        `Not enough ETH to pay for gas for swap - balance is ${nativeEthBalance.toString()}, needed ${requiredSwapGasCost.toString()}`
      );
    }

    const litActionResponse = await litNodeClient.executeJs({
      sessionSigs,
      ipfsId: VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID,
      jsParams: {
        toolParams: {
          amountIn: wethToSpend.toString(),
          chainId: BASE_CHAIN_ID,
          pkpEthAddress: walletAddress,
          rpcUrl: BASE_RPC_URL,
          tokenIn: WETH_ADDRESS!,
          // tokenInDecimals: tokenInInfo.decimals.toString(),
          tokenOut: topCoin.coinAddress,
          // tokenOutDecimals: tokenOutInfo.decimals.toString(),
        },
      },
    });

    consola.debug('Swap LIT Action Response:', litActionResponse);

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
  } catch (e) {
    const err = e as Error;
    consola.error(err.message, err.stack);
    throw e;
  }
}

export const jobName = 'execute-swap';
export const processJob = executeSwap;
