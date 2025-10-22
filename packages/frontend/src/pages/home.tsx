import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DepositWBTC } from '@/components/deposit-wbtc';
import { YieldPositions } from '@/components/yield-positions';
import { Wallet } from '@/components/wallet';
import { PageHeader } from '@/components/ui/page-header';

enum Tab {
  Deposit = 'deposit',
  Positions = 'positions',
  Wallet = 'wallet',
}

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Deposit);

  return (
    <main className="relative px-4 sm:px-6 md:px-8 flex justify-center pt-8 sm:pt-16 md:pt-24 pb-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm w-full">
          <PageHeader
            title="BitcoinMilker"
            subtitle="wBTC Yield Optimizer"
            description={
              <>
                Deposit your wBTC and let our agent maximize yield through AAVE lending and
                yield-bearing token strategies. Learn more about{' '}
                <a
                  href="https://docs.heyvincent.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: '#FF4205' }}
                >
                  Vincent
                </a>
                .
              </>
            }
          />

          <Tabs
            data-testid="milker-tabs"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as Tab)}
            className="w-full items-stretch"
          >
            <TabsList
              className="mb-4 flex space-x-2 rounded-md p-2 w-full mt-6"
              style={{ backgroundColor: 'transparent' }}
            >
              <TabsTrigger value={Tab.Deposit} className="data-[state=active]:bg-[#FF4205]">
                Deposit wBTC
              </TabsTrigger>
              <TabsTrigger value={Tab.Positions} className="data-[state=active]:bg-[#FF4205]">
                Yield Positions
              </TabsTrigger>
              <TabsTrigger value={Tab.Wallet} className="data-[state=active]:bg-[#FF4205]">
                Wallet
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
              <TabsContent value={Tab.Deposit}>
                <DepositWBTC onDeposit={() => setActiveTab(Tab.Positions)} />
              </TabsContent>
              <TabsContent value={Tab.Positions}>
                <YieldPositions />
              </TabsContent>
              <TabsContent value={Tab.Wallet}>
                <Wallet />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};
