import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

import { LitContractsInstance } from './LitContractsInstance';

let instance: LitContractsInstance | null = null;

export async function getLitContractsInstance({
  network,
}: {
  network: LIT_NETWORKS_KEYS;
}): Promise<LitContracts> {
  if (instance) {
    // connect() is idempotent; if we're retrying from outside, attempt to connect again
    // This is a no-op if already connected 🎉 but if a prior attempt fails, it'll try again.
    await instance.connect();
    return instance.litContracts;
  }

  instance = new LitContractsInstance({ network });
  await instance.connect();

  return instance.litContracts;
}
