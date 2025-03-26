import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false];
const BooleanOrBooleanStringSchema = z
  .any()
  .refine((val) => booleanStrings.includes(val), { message: 'must be boolean' })
  .transform((val) => val === 'true' || val === true);

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BASE_RPC_URL: z.string().url(),
    COINRANKING_API_KEY: z.string(),
    CORS_ALLOWED_DOMAIN: z.string(),
    IS_PRODUCTION: BooleanOrBooleanStringSchema,
    MONGODB_URI: z.string().url(),
    PORT: z.coerce.number(),
    VINCENT_DELEGATEE_PRIVATE_KEY: z.string(),
    VINCENT_TOOL_UNISWAP_SWAP_IPFS_ID: z.string(),
  },
});
