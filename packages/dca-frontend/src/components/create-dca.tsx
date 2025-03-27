import React, { useState, FormEvent } from 'react';

import { useBackend } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface CreateDCAProps {
  onCreate?: () => void;
}

export const CreateDCA: React.FC<CreateDCAProps> = ({ onCreate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [name] = useState<string>('name');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('1.00');
  const [frequency, setFrequency] = useState<string>('weekly');
  const { createDCA } = useBackend();

  const handleCreateDCA = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      alert('Please enter a positive DCA amount.');
      return;
    }
    if (!frequency) {
      alert('Please select a frequency.');
      return;
    }

    setLoading(true);
    try {
      await createDCA({
        name,
        purchaseAmount,
        purchaseIntervalHuman: frequency,
      });
      onCreate?.();
    } catch (error) {
      console.error('Error creating DCA:', error);
      alert('Error creating DCA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white p-6 shadow-sm">
      <form onSubmit={handleCreateDCA}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Start DCA with Top Base Memecoin</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            This system will automatically purchase the top memecoin on Base at regular intervals
            based on your schedule.
          </CardDescription>
        </CardHeader>

        <Separator className="my-8" />

        <CardContent className="my-8">
          <div className="space-y-4">
            <Box className="py-0 gap-0 text-center">
              <Label htmlFor="dcaAmount" className="mb-1 block text-sm font-medium">
                DCA Amount
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  className="text-center"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  disabled={loading}
                />
                <span className="text-sm">USD</span>
              </div>
            </Box>

            <Separator />

            <Box className="py-0 gap-0 text-center">
              <Label htmlFor="frequency" className="mb-1 block text-sm font-medium">
                Frequency
              </Label>
              <Select value={frequency} onValueChange={setFrequency} disabled={loading}>
                <SelectTrigger id="frequency" className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 minute">Every minute</SelectItem>
                  <SelectItem value="1 hour">Hourly</SelectItem>
                  <SelectItem value="1 day">Daily</SelectItem>
                  <SelectItem value="1 week">Weekly</SelectItem>
                  <SelectItem value="1 month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </Box>
          </div>
        </CardContent>

        <Separator className="my-8" />

        <CardFooter className="flex justify-center">
          <Button className="w-full" type="submit">
            Create DCA
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
