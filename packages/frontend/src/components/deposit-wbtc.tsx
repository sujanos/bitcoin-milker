import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DepositWBTCProps {
  onDeposit: () => void;
}

export const DepositWBTC: React.FC<DepositWBTCProps> = ({ onDeposit }) => {
  const [amount, setAmount] = useState('');

  const handleDeposit = () => {
    // TODO: Implement wBTC deposit logic
    console.log('Depositing wBTC:', amount);
    onDeposit();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit wBTC</CardTitle>
        <CardDescription>
          Deposit your wrapped Bitcoin to start earning yield through AAVE lending and PT-ETH
          strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (wBTC)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Expected Yield Strategy:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Supply wBTC as collateral in AAVE</li>
            <li>• Borrow ETH at ~2.5% interest rate</li>
            <li>• Purchase PT-ETH yielding ~7%</li>
            <li>• Net yield: ~4.5% APY</li>
          </ul>
        </div>

        <Button
          onClick={handleDeposit}
          className="w-full"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Deposit wBTC & Start Yield Farming
        </Button>
      </CardContent>
    </Card>
  );
};
