import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BACKEND_URL } from '@/config';

export const YieldPositions: React.FC = () => {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/positions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setPositions(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch positions');
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration (fallback if API fails)
  const mockPositions = [
    {
      id: '1',
      token: 'cbBTC',
      amount: '1.5',
      collateralValue: '$95,000',
      borrowedETH: '30',
      borrowedValue: '$75,000',
      weETHCollateral: '25',
      weETHValue: '$80,000',
      totalCollateral: '$175,000',
      totalBorrowed: '$75,000',
      healthFactor: 2.3,
      yield: '6.8%',
      strategy: 'cbBTC → AAVE → ETH → weETH → AAVE Collateral',
      status: 'active',
    },
  ];

  const displayPositions = positions.length > 0 ? positions : mockPositions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Yield Positions</h3>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Loading positions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Yield Positions</h3>
        <Badge variant="secondary">{displayPositions.length} Active Positions</Badge>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {displayPositions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No active positions yet.</p>
            <p className="text-sm text-gray-400 mt-1">Deposit cbBTC to start earning yield.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {displayPositions.map((position) => (
            <Card key={position.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{position.strategy}</CardTitle>
                  <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                    {position.status}
                  </Badge>
                </div>
                <CardDescription>Health Factor: {position.healthFactor}x</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>cbBTC Collateral:</span>
                  <span className="font-medium">{position.amount} cbBTC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Collateral Value:</span>
                  <span className="font-medium">{position.collateralValue || '$95,000'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Borrowed ETH:</span>
                  <span className="font-medium">{position.borrowedETH || '30'} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>weETH Collateral:</span>
                  <span className="font-medium">{position.weETHCollateral || '25'} weETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Yield:</span>
                  <span className="font-medium text-green-600">{position.yield || '6.8%'}</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min((position.healthFactor / 3) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Health Factor Progress</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
