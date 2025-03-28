import consola from 'consola';
import DataLoader from 'dataloader';
import Cache from 'node-cache';

import { wrapNodeCacheForDataloader } from './dataLoaderCache';
import { env } from '../../../env';

const cache = new Cache({ checkperiod: 0, stdTTL: 5, useClones: false });

const { COINRANKING_API_KEY } = env;

const logger = consola.withTag('CoinRankingLoader');

export interface Coin {
  coinAddress: string;
  name: string;
  price: string;
  symbol: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function batchLoadFn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  keys: readonly string[]
): Promise<{ coins: ArrayLike<Coin | Error> }[]> {
  logger.debug('batchLoadFn()');

  const url = new URL('https://api.coinranking.com/v2/coins');
  url.searchParams.append('blockchains[]', 'base');
  url.searchParams.append('tags[]', 'meme');

  logger.info(`Fetching top coins from CoinRanking API: ${url.toString()}`);
  const response = await fetch(url, {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'x-access-token': COINRANKING_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const { data, status } = (await response.json()) as {
    data: {
      coins: Array<{
        contractAddresses: string[];
        name: string;
        price: string;
        symbol: string;
      }>;
    };
    status: string;
  };

  if (status !== 'success') {
    throw new Error('API returned unsuccessful status');
  }

  const coins = data.coins.map((coin) => {
    const baseAddress = coin.contractAddresses.find((addr) =>
      addr.toLowerCase().startsWith('base/')
    );

    if (!baseAddress) {
      throw new Error(`No Base network address found for coin ${coin.symbol}`);
    }

    return {
      coinAddress: baseAddress.replace('base/', ''),
      name: coin.name,
      price: coin.price,
      symbol: coin.symbol,
    };
  });

  return [{ coins }];
}

const loader = new DataLoader(batchLoadFn, {
  cacheMap: wrapNodeCacheForDataloader<{ coins: Coin[] }>(cache),
});

export const getTopBaseMemeCoin = async () => {
  logger.debug(`getTopBaseMemeCoin()`);

  const topCoins = (await loader.load('topCoins')).coins;
  logger.debug(`topCoins: ${JSON.stringify(topCoins)}`);
  return topCoins[0];
};
