import { useCallback, useContext, useState } from 'react';
import { VincentSDK } from '@lit-protocol/vincent-sdk';

import { APP_ID, BACKEND_URL, CONSENT_PAGE_BASE, REDIRECT_URI } from '@/config';
import { JwtContext } from '@/contexts/jwt';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface CreateDCARequest {
  name: string;
  purchaseAmount: string;
  purchaseIntervalHuman: string;
}

export interface DCA extends CreateDCARequest {
  _id: string;
  active: boolean;
  enabledAt: string;
  updatedAt: string;
}

export const useBackend = () => {
  const { authInfo } = useContext(JwtContext);
  const [vincentSdk] = useState(() => new VincentSDK({ consentPageUrl: CONSENT_PAGE_BASE }));

  const getJwt = useCallback(() => {
    // Redirect to Vincent Auth consent page with appId and the uri we want to receive the jwt
    vincentSdk.redirectConsentPage(APP_ID, REDIRECT_URI);
  }, [vincentSdk]);

  const sendRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('No JWT to query backend');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.jwt}`,
      };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    [authInfo]
  );

  const createDCA = useCallback(
    async (dca: CreateDCARequest) => {
      return sendRequest<DCA>('/schedule', 'POST', dca);
    },
    [sendRequest]
  );

  const getDCAs = useCallback(async () => {
    return sendRequest<DCA[]>('/schedules', 'GET');
  }, [sendRequest]);

  const disableDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}/disable`, 'PUT');
    },
    [sendRequest]
  );

  const enableDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}/enable`, 'PUT');
    },
    [sendRequest]
  );

  const editDCA = useCallback(
    async (scheduleId: string, dca: CreateDCARequest) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}`, 'PUT', dca);
    },
    [sendRequest]
  );

  const deleteDCA = useCallback(
    async (scheduleId: string) => {
      return sendRequest<DCA>(`/schedules/${scheduleId}`, 'DELETE');
    },
    [sendRequest]
  );

  return {
    createDCA,
    deleteDCA,
    disableDCA,
    editDCA,
    enableDCA,
    getDCAs,
    getJwt,
  };
};
