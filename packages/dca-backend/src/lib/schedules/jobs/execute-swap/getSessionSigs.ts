import { ethers } from 'ethers';

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY, LIT_RPC } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

import { env } from '../../../env';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;

export async function getSessionSigs({ litNodeClient }: { litNodeClient: LitNodeClient }) {
  const ethersSigner = new ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  );

  return litNodeClient.getSessionSigs({
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
}
