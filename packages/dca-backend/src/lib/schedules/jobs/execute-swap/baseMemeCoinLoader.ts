import DataLoader from 'dataloader';
import Cache from 'node-cache';

import { wrapNodeCacheForDataloader } from './dataLoaderCache';
import { env } from '../../../env';

const cache = new Cache({ checkperiod: 0, stdTTL: 5, useClones: false });

const { COINRANKING_API_KEY } = env;

export interface Coin {
  coinAddress: string;
  name: string;
  price: string;
  symbol: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function batchLoadFn(keys: readonly string[]): Promise<ArrayLike<Coin | Error>> {
  const url = new URL('https://api.coinranking.com/v2/coins');
  url.searchParams.append('blockchains[]', 'base');
  url.searchParams.append('tags[]', 'meme');

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

  return data.coins.map((coin) => {
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
}

const loader = new DataLoader(batchLoadFn, {
  cacheMap: wrapNodeCacheForDataloader<Coin>(cache),
});

export const getTopBaseMemeCoin = async () => {
  const topCoins = (await loader.load('topCoins')) as unknown as Coin[];
  return topCoins[0];
};
