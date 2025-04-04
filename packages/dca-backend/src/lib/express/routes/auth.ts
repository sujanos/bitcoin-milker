import { NextFunction, Request, Response } from 'express';

import { jwt } from '@lit-protocol/vincent-sdk';

import { env } from '../../env';

const { verify } = jwt;

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

  const [scheme, jwtStr] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: 'Token malformatted' });
    return;
  }

  try {
    const decodedJWT = verify(jwtStr, ALLOWED_AUDIENCE);
    if (!decodedJWT) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = {
      jwt: jwtStr,
      pkp: {
        address: decodedJWT.payload.pkpAddress,
        publicKey: decodedJWT.payload.pkpPublicKey,
      },
    };
    next();
  } catch (e) {
    res.status(401).json({ error: `Invalid token: ${(e as Error).message}` });
  }
};
