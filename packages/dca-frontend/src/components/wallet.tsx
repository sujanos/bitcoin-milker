import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { LogOut, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Box, BoxDescription, BoxTitle } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { JwtContext } from '@/contexts/jwt';
import { useChain } from '@/hooks/useChain';

export const Wallet: React.FC = () => {
  const { chain, provider, wethContract } = useChain();
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [wethBalance, setWethBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { authInfo, logOut } = useContext(JwtContext);

  // Function to fetch PKP wethBalanceWei directly using ethers.js
  const fetchPkpBalance = useCallback(async () => {
    if (!authInfo?.pkp.address) return;

    try {
      setIsLoadingBalance(true);
      setError(null);

      const [ethBalanceWei, wethBalanceWei] = await Promise.all([
        provider.getBalance(authInfo?.pkp.address),
        wethContract.balanceOf(authInfo?.pkp.address),
      ]);

      // Both have 18 decimal places
      setEthBalance(ethers.utils.formatEther(ethBalanceWei));
      setWethBalance(ethers.utils.formatEther(wethBalanceWei));

      setIsLoadingBalance(false);
    } catch (err: unknown) {
      console.error('Error fetching PKP wethBalanceWei:', err);
      setError(`Failed to fetch wallet balance`);
      setIsLoadingBalance(false);
    }
  }, [authInfo, provider, wethContract]);

  useEffect(() => {
    fetchPkpBalance();
  }, [fetchPkpBalance]);

  return (
    <Card data-test-id="wallet" className="w-full bg-white p-6 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Wallet</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="text-center">
        <Box className="flex flex-row items-center justify-between">
          <BoxTitle>Wallet Address:</BoxTitle>

          <a
            href={`${chain.blockExplorerUrls[0]}/address/${authInfo?.pkp.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {authInfo?.pkp.address ?? 'Loading...'}
          </a>
        </Box>

        <Separator />

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>Network:</BoxDescription>
          <Badge>{chain.name}</Badge>
        </Box>

        <Separator />

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>ETH Balance:</BoxDescription>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {isLoadingBalance
              ? 'Loading...'
              : `${parseFloat(ethBalance).toFixed(4)} ${chain.symbol}`}
          </span>
        </Box>

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>WETH Balance:</BoxDescription>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {isLoadingBalance ? 'Loading...' : `${parseFloat(wethBalance).toFixed(4)} WETH`}
          </span>
        </Box>

        {error && (
          <div
            style={{
              backgroundColor: '#fff1f0',
              color: '#ff4d4f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span role="img" aria-label="Error">
              ⚠️
            </span>{' '}
            {error}
          </div>
        )}

        <Button className="w-full" disabled={isLoadingBalance} onClick={fetchPkpBalance}>
          {isLoadingBalance ? (
            <>
              <Spinner variant="destructive" size="sm" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCcw /> Refresh Balance
            </>
          )}
        </Button>
        <Button className="w-full my-1" variant="destructive" onClick={logOut}>
          <LogOut /> Log Out
        </Button>
      </CardContent>

      <CardFooter className="flex flex-col items-center">
        <CardDescription className="mt-2 text-sm text-gray-500">
          Powered by{' '}
          <a
            href="https://litprotocol.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            LIT Protocol
          </a>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};
