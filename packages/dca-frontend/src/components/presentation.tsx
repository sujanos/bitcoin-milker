import React from 'react';

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
import { useBackend } from '@/hooks/useBackend';

export const Presentation: React.FC = () => {
  const { getJwt } = useBackend();

  return (
    <Card data-testId="presentation" className="w-full max-w-md bg-white p-6 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Memecoin DCA</CardTitle>
        <CardDescription className="text-gray-600">
          Automated Dollar-Cost Averaging for Cryptocurrency
        </CardDescription>
      </CardHeader>

      <Separator className="my-4" />

      <CardContent className="text-center">
        <p className="text-gray-700">
          Welcome to the Vincent DCA service. This application allows you to set up automated
          dollar-cost averaging for your cryptocurrency investments.
        </p>
        <p className="mt-4 text-gray-700">
          To get started, please authenticate with Vincent to manage your DCA schedules.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-center">
        <Button onClick={getJwt} className="bg-purple-600 text-white hover:bg-purple-700">
          Authenticate with Vincent
        </Button>
        <div className="mt-2 text-sm text-gray-500">
          Powered by{' '}
          <a
            href="https://litprotocol.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            LIT Protocol
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};
