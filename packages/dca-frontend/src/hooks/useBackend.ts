import { useCallback, useContext } from 'react';

import { BACKEND_URL, CONSENT_PAGE_DCA_URL } from '@/config';
import { JwtContext } from '@/contexts/jwt';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface DCARequest {
  name: string;
  purchaseAmount: string;
  purchaseIntervalHuman: string;
}

export interface DCA extends DCARequest {
  _id: string;
  active: boolean;
  // walletAddress: string;
  enabledAt: string;
  // userEditedAt: string;
  // createdAt: string;
  updatedAt: string;
}

export const useBackend = () => {
  const { authInfo } = useContext(JwtContext);

  const getJwt = useCallback(() => {
    // Redirect to Vincent Auth consent page with appId and version
    window.location.href = CONSENT_PAGE_DCA_URL;
  }, []);

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
    async (dca: DCARequest) => {
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

  return {
    getJwt,
    createDCA,
    getDCAs,
    disableDCA,
    enableDCA,
  };
};
