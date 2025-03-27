import { Buffer } from 'buffer';

import * as secp256k1 from '@noble/secp256k1';
import * as didJWT from 'did-jwt';
import { ethers } from 'ethers';
import { NextFunction, Request, Response } from 'express';

import {
  splitJWT,
  processJWTSignature,
  isJWTExpired,
  validateJWTTime,
} from '@lit-protocol/vincent-sdk';

import { env } from '../../env';
import { serviceLogger } from '../../logger';

const { ALLOWED_AUDIENCE } = env;

// TODO copied from vincent SDK. Modify that sdk so it can validate tokens without saving to its storage and remove this
function verifyJWTSignature(jwt: string, expectedAudience: string): boolean {
  try {
    const decoded = didJWT.decodeJWT(jwt);

    if (!decoded.payload.exp) {
      serviceLogger.error('JWT verification failed: No expiration claim (exp) set');
      return false;
    }

    if (!decoded.payload.pkpPublicKey) {
      serviceLogger.error('JWT verification failed: Missing pkpPublicKey in payload');
      return false;
    }

    const isExpired = isJWTExpired(decoded.payload);
    if (isExpired) {
      serviceLogger.error('JWT verification failed: Token has expired');
      return false;
    }

    const isValidTime = validateJWTTime(decoded.payload);
    if (!isValidTime) {
      // Check which specific time claim is invalid
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.payload.nbf && currentTime < decoded.payload.nbf) {
        serviceLogger.error(
          'JWT verification failed: Token not yet valid (nbf claim is in the future)'
        );
      } else if (decoded.payload.iat && currentTime < decoded.payload.iat - 30) {
        serviceLogger.error(
          'JWT verification failed: Token issued in the future (iat claim is ahead of current time)'
        );
      } else {
        serviceLogger.error('JWT verification failed: Invalid time claims');
      }
      return false;
    }

    // Always validate audience - reject if no audience claim or expected audience isn't included
    if (!decoded.payload.aud) {
      serviceLogger.error('JWT verification failed: No audience claim (aud) set');
      return false;
    }

    if (!expectedAudience) {
      serviceLogger.error('JWT verification failed: Expected audience cannot be empty');
      return false;
    }

    const audiences = Array.isArray(decoded.payload.aud)
      ? decoded.payload.aud
      : [decoded.payload.aud];

    if (!audiences.includes(expectedAudience)) {
      serviceLogger.error(
        `JWT verification failed: Expected audience ${expectedAudience} not found in aud claim`
      );
      return false;
    }

    try {
      const { signature, signedData } = splitJWT(jwt);

      // Process signature from base64url to binary
      const signatureBytes = processJWTSignature(signature);

      // Extract r and s values from the signature
      const r = signatureBytes.slice(0, 32);
      const s = signatureBytes.slice(32, 64);

      // Process public key
      let publicKey = decoded.payload.pkpPublicKey;
      if (publicKey.startsWith('0x')) {
        publicKey = publicKey.substring(2);
      }

      const publicKeyBytes = Buffer.from(publicKey, 'hex');

      // PKPEthersWallet.signMessage() adds Ethereum prefix, so we need to add it here too
      const ethPrefixedMessage = `\x19Ethereum Signed Message:\n${signedData.length}${signedData}`;
      const messageBuffer = Buffer.from(ethPrefixedMessage, 'utf8');

      const messageHash = ethers.utils.keccak256(messageBuffer);
      const messageHashBytes = Buffer.from(messageHash.substring(2), 'hex');

      const signatureForSecp = new Uint8Array([...r, ...s]);

      // Verify the signature against the public key
      const isVerified = secp256k1.verify(signatureForSecp, messageHashBytes, publicKeyBytes);

      if (!isVerified) {
        serviceLogger.error('JWT verification failed: Invalid signature');
        return false;
      }

      return true;
    } catch (error) {
      serviceLogger.error('JWT signature verification error:', error);
      return false;
    }
  } catch (error) {
    serviceLogger.error('JWT verification error:', error);
    return false;
  }
}

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

  const jwtVerifies = verifyJWTSignature(jwt, ALLOWED_AUDIENCE);
  if (!jwtVerifies) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const decodedJWT = didJWT.decodeJWT(jwt);
  const pkpPublicKey = decodedJWT.payload.pkpPublicKey as string;
  const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);

  req.user = {
    jwt,
    pkp: {
      address: pkpAddress,
      publicKey: pkpPublicKey,
    },
  };
  next();
};
