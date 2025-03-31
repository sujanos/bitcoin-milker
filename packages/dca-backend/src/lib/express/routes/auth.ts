import { NextFunction, Request, Response } from 'express';

import { VincentSDK } from '@lit-protocol/vincent-sdk';

import { env } from '../../env';

const { ALLOWED_AUDIENCE } = env;

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    res.status(401).json({ error: 'Token error' });
    return;
  }

  const [scheme, jwt] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: 'Token malformatted' });
    return;
  }

  const vincentSdk = new VincentSDK();
  if (!vincentSdk.verifyJWT(jwt, ALLOWED_AUDIENCE)) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const decodedJWT = vincentSdk.decodeJWT(jwt);

  req.user = {
    jwt,
    pkp: {
      address: decodedJWT.payload.pkpAddress,
      publicKey: decodedJWT.payload.pkpPublicKey,
    },
  };
  next();
};
