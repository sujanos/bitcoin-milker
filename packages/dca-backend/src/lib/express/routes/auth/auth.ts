import { NextFunction, Request, Response } from 'express';

import { jwt } from '@lit-protocol/vincent-sdk';

import { AuthenticatedRequest, AuthenticatedRequestHandler } from './types';

const { verify } = jwt;

function assertAuthenticatedRequest(req: Request): asserts req is AuthenticatedRequest {
  if (!('user' in req) || typeof req.user !== 'object' || !req.user) {
    throw new Error('Request is not an AuthenticatedRequest: Missing or invalid "user" property');
  }

  // Cast with a type assertion
  const user = req.user as Partial<{
    decodedJWT: unknown;
    pkpAddress: unknown;
    rawJWT: unknown;
  }>;

  const { decodedJWT, pkpAddress, rawJWT } = user;

  if (
    typeof rawJWT !== 'string' ||
    typeof pkpAddress !== 'string' ||
    typeof decodedJWT !== 'object' ||
    decodedJWT === null
  ) {
    throw new Error('Request is not an AuthenticatedRequest: Invalid "user" properties');
  }
}

export const asAuthenticatedReq =
  (handler: AuthenticatedRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    try {
      assertAuthenticatedRequest(req);
      handler(req, res, next);
    } catch (e) {
      res.status(401).json({ error: 'Not authenticated' });
    }
  };

export const getAuthenticateUserExpressHandler =
  (allowedAudience: string) => async (req: Request, res: Response, next: NextFunction) => {
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

    const [scheme, rawJWT] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ error: 'Token malformatted' });
      return;
    }

    try {
      const decodedJWT = verify(rawJWT, allowedAudience);
      if (!decodedJWT) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as AuthenticatedRequest).user = {
        decodedJWT,
        rawJWT,
        pkpAddress: decodedJWT.payload.pkpAddress,
      };

      next();
    } catch (e) {
      res.status(401).json({ error: `Invalid token: ${(e as Error).message}` });
    }
  };
