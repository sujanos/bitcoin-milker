import React, { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { VincentSDK } from '@lit-protocol/vincent-sdk';
import { ethers } from 'ethers';

const JWT_URL_KEY = 'jwt';

function clearQueryParams() {
  window.history.replaceState(null, '', window.location.pathname);
}

export interface AuthInfo {
  jwt: string;
  pkp: {
    address: string;
    publicKey: string;
  };
}

interface JwtContextType {
  authInfo: AuthInfo | null | undefined;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: undefined,
  logWithJwt: () => {},
  logOut: () => {},
});

interface JwtProviderProps {
  children: ReactNode;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({ children }) => {
  const [vincentSdk] = useState(() => new VincentSDK());
  const [authInfo, setAuthInfo] = useState<AuthInfo | null | undefined>(undefined);

  const logOut = useCallback(async () => {
    clearQueryParams();
    setAuthInfo(null);
    await vincentSdk.clearJWT();
  }, [vincentSdk]);

  const logWithJwt = useCallback(async () => {
    const jwt =
      (await vincentSdk.getJWT()) || new URLSearchParams(window.location.search).get(JWT_URL_KEY);

    await vincentSdk.storeJWT(jwt ?? '');
    const jwtVerifies = await vincentSdk.verifyJWT(window.location.origin);
    if (!jwt || !jwtVerifies) {
      return logOut(); // Clear any leftover and logout
    }

    const decodedJWT = await vincentSdk.decodeJWT();
    const pkpPublicKey = decodedJWT.payload.pkpPublicKey as string;
    const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);
    setAuthInfo({
      jwt,
      pkp: {
        address: pkpAddress,
        publicKey: pkpPublicKey,
      },
    });
    clearQueryParams();
  }, [logOut, vincentSdk]);

  useEffect(() => {
    logWithJwt().catch(logOut);
  }, [logWithJwt, logOut]);

  return (
    <JwtContext.Provider value={{ authInfo, logWithJwt, logOut }}>{children}</JwtContext.Provider>
  );
};
