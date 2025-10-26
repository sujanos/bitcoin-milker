import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BACKEND_URL } from '@/config';

interface DepositCBBTCProps {
  onDeposit: () => void;
}

export const DepositCBBTC: React.FC<DepositCBBTCProps> = ({ onDeposit }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Get user wallet address from Vincent auth
      const userAddress = '0x1234567890123456789012345678901234567890'; // Mock address

      const response = await fetch(`${BACKEND_URL}/deposit-cbbtc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('Deposit successful:', result.data);
        onDeposit();
      } else {
        throw new Error(result.error || 'Deposit failed');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process deposit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit cbBTC</CardTitle>
        <CardDescription>
          Deposit your Coinbase Bitcoin to start earning yield through AAVE lending and weETH
          strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (cbBTC)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Expected Yield Strategy:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Supply cbBTC as collateral in AAVE (Base network)</li>
            <li>• Borrow ETH at competitive rates</li>
            <li>• Swap ETH to weETH for enhanced yield</li>
            <li>• Supply weETH as additional collateral</li>
            <li>• Net yield: 5-8% APY with risk management</li>
          </ul>
        </div>

        <Button
          onClick={handleDeposit}
          className="w-full"
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
        >
          {isLoading ? 'Processing...' : 'Deposit cbBTC & Start Yield Farming'}
        </Button>
      </CardContent>
    </Card>
  );
};
