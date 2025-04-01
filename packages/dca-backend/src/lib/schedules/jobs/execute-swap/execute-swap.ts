import consola from 'consola';
import { ethers } from 'ethers';
import { Types } from 'mongoose';

import { LIT_NETWORK } from '@lit-protocol/constants';

import { Coin, getTopBaseMemeCoin } from './baseMemeCoinLoader';
import { getEthereumPriceUsd } from './ethPriceLoader';
import { getSessionSigs } from './getSessionSigs';
import {
  getAddressesByChainId,
  getErc20Info,
  getEstimatedGasForApproval,
  getEstimatedUniswapCosts,
} from './utils';
import { getERC20Contract, getExistingAllowance } from './utils/checkBalancesAndApproval';
import { env } from '../../../env';
import { getLitNodeClientInstance } from '../../../LitNodeClient/getLitNodeClient';
import { PurchasedCoin } from '../../../mongo/models/PurchasedCoin';
import { Schedule } from '../../../mongo/models/Schedule';

export interface ExecuteSwapParams {
  scheduleId: Types.ObjectId;
}

const { BASE_RPC_URL, VINCENT_TOOL_APPROVAL_IPFS_ID, VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID } = env;

async function executeSwap({ scheduleId }: ExecuteSwapParams): Promise<void> {
  // Fetch top coin first to get the target token
  consola.debug('Fetching top coin...');
  const topCoin = (await getTopBaseMemeCoin()) as unknown as Coin;
  consola.debug('Got top coin:', topCoin);

  const schedule = await Schedule.findById(scheduleId).orFail().lean();

  const { purchaseAmount, walletAddress } = schedule;

  // FIXME: This should be type-safe
  const { WETH_ADDRESS } = getAddressesByChainId('8453');

  const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL);

  const [tokenInInfo, tokenOutInfo, ethPriceUsd, existingAllowance] = await Promise.all([
    getErc20Info(baseProvider, WETH_ADDRESS!),
    getErc20Info(baseProvider, topCoin.coinAddress),
    getEthereumPriceUsd(),
    getExistingAllowance('8453', getERC20Contract(WETH_ADDRESS!, baseProvider), walletAddress),
  ]);

  const usdAmountStr = purchaseAmount.toString();
  const wethPriceStr = ethPriceUsd.toString();

  const wethAmount = parseFloat(usdAmountStr) / parseFloat(wethPriceStr);
  const wethToSpend = ethers.utils.parseEther(wethAmount.toFixed(18));

  consola.log('ethPriceUsd', ethPriceUsd.toString());
  consola.log('purchaseAmount', purchaseAmount.toString());
  consola.log('wethAmount', wethAmount.toString());
  consola.log('wethToSpend', wethToSpend.toString());
  consola.log('wethAmount.toFixed(18)', wethAmount.toFixed(18));
  consola.log('existingAllowance', existingAllowance);

  const needsApproval = existingAllowance.lte(wethToSpend);

  const [{ gasCost, swapCost }, nativeEthBalance, wEthBalance, approvalGasCost] = await Promise.all(
    [
      getEstimatedUniswapCosts({
        amountIn: wethAmount.toFixed(18).toString(),
        pkpEthAddress: walletAddress,
        tokenInAddress: WETH_ADDRESS!,
        tokenInDecimals: tokenInInfo.decimals,
        tokenOutAddress: topCoin.coinAddress,
        tokenOutDecimals: tokenOutInfo.decimals,
        userChainId: '8453',
        userRpcProvider: baseProvider,
      }),
      baseProvider.getBalance(walletAddress),
      tokenInInfo.ethersContract.balanceOf(walletAddress),
      needsApproval
        ? getEstimatedGasForApproval(
            baseProvider,
            '8453',
            WETH_ADDRESS!,
            wethToSpend.mul(5).toString(),
            tokenInInfo.decimals.toString(),
            walletAddress
          )
        : Promise.resolve(null),
    ]
  );

  // Calculate the maximum possible gas cost
  const requiredSwapGasCost = gasCost.estimatedGas.mul(gasCost.maxFeePerGas);
  const requiredApprovalGasCost = approvalGasCost
    ? approvalGasCost.estimatedGas.mul(approvalGasCost.maxFeePerGas)
    : 0n;

  const requiredGasCost = requiredSwapGasCost.add(requiredApprovalGasCost);
  const isBalanceSufficient = nativeEthBalance.gte(requiredGasCost);

  if (!isBalanceSufficient) {
    consola.log('requiredSwapGasCost', requiredSwapGasCost);
    consola.log('requiredApprovalGasCost', requiredApprovalGasCost);
    consola.log('nativeEthBalance', nativeEthBalance);
    throw new Error(
      `Not enough ETH to pay for gas - balance is ${nativeEthBalance.toString()}, needed ${requiredGasCost.toString()}`
    );
  }

  if (swapCost.amountOutMin.gt(wEthBalance)) {
    throw new Error(
      `Not enough WETH to swap - balance is ${wEthBalance.toString()}, needed ${swapCost.amountOutMin.toString()}`
    );
  }

  const litNodeClient = await getLitNodeClientInstance({ network: LIT_NETWORK.Datil });

  const sessionSigs = await getSessionSigs({ litNodeClient });

  if (needsApproval) {
    const litActionResponse = await litNodeClient.executeJs({
      sessionSigs,
      ipfsId: VINCENT_TOOL_APPROVAL_IPFS_ID,
      jsParams: {
        litActionParams: {
          amountIn: wethToSpend.mul(5).toString(), // Approve 5x the amount to spend so we don't wait for approval tx's every time we run
          chainId: '8453',
          pkpEthAddress: walletAddress,
          rpcUrl: BASE_RPC_URL,
          tokenIn: WETH_ADDRESS!,
        },
      },
    });

    consola.debug('Approval LIT Action Response:', litActionResponse);
  }

  const litActionResponse = await litNodeClient.executeJs({
    sessionSigs,
    ipfsId: VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID,
    jsParams: {
      litActionParams: {
        amountIn: wethToSpend.toString(),
        chainId: '8453',
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
}

export const jobName = 'execute-swap';
export const processJob = executeSwap;
