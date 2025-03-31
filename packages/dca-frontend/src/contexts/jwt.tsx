import React, { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { VincentSDK } from '@lit-protocol/vincent-sdk';

import { APP_ID } from '@/config';

const JWT_URL_KEY = 'jwt';
const APP_JWT_KEY = `${APP_ID}-${JWT_URL_KEY}`;

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
    localStorage.removeItem(APP_JWT_KEY);
  }, []);

  const logWithJwt = useCallback(async () => {
    const jwt =
      new URLSearchParams(window.location.search).get(JWT_URL_KEY) ||
      localStorage.getItem(APP_JWT_KEY);
    if (!jwt || !vincentSdk.verifyJWT(jwt, window.location.origin)) {
      return logOut(); // Clear any leftover and logout
    }

    localStorage.setItem(APP_JWT_KEY, jwt);
    const decodedJWT = vincentSdk.decodeJWT(jwt);
    setAuthInfo({
      jwt,
      pkp: {
        address: decodedJWT.payload.pkpAddress,
        publicKey: decodedJWT.payload.pkpPublicKey,
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
