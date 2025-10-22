import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const YieldPositions: React.FC = () => {
  // Mock data for demonstration
  const positions = [
    {
      id: '1',
      collateral: '0.5 wBTC',
      borrowed: '2.1 ETH',
      healthFactor: 2.3,
      yieldAPY: '4.5%',
      strategy: 'PT-ETH Yield Farming',
      status: 'active',
    },
    {
      id: '2',
      collateral: '1.0 wBTC',
      borrowed: '4.0 ETH',
      healthFactor: 2.1,
      yieldAPY: '4.2%',
      strategy: 'PT-ETH Yield Farming',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Yield Positions</h3>
        <Badge variant="secondary">2 Active Positions</Badge>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No active positions yet.</p>
            <p className="text-sm text-gray-400 mt-1">Deposit wBTC to start earning yield.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {positions.map((position) => (
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
                  <span>Collateral:</span>
                  <span className="font-medium">{position.collateral}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Borrowed:</span>
                  <span className="font-medium">{position.borrowed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Yield APY:</span>
                  <span className="font-medium text-green-600">{position.yieldAPY}</span>
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
