import React, { useState, useEffect } from 'react';

import { useBackend, DCA } from '@/hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ActiveDcas: React.FC = () => {
  const [activeDCAs, setActiveDCAs] = useState<DCA[]>([]);
  const { getDCAs } = useBackend();

  useEffect(() => {
    const fetchDCAs = async () => {
      try {
        const dcas = await getDCAs();
        setActiveDCAs(dcas);
      } catch (error) {
        console.error('Error fetching active DCAs:', error);
      }
    };
    fetchDCAs();
  }, [getDCAs]);

  if (!activeDCAs.length) {
    return (
      <div className="dcas-list">
        <div className="loading-indicator">Loading dcas...</div>
      </div>
    );
  }

  return (
    <Card data-test-id="active-dcas" className="w-full bg-white p-6 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Active DCA Schedules</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {activeDCAs.map((dca) => {
              const uniqueKey = dca._id;

              return (
                <TableRow key={uniqueKey}>
                  <TableCell>${dca.purchaseAmount}</TableCell>
                  <TableCell>
                    {/*{formatFrequency(dca.frequency)}*/}
                    Daily
                  </TableCell>
                  <TableCell>{new Date(dca.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <span>{dca.active ? 'Active' : 'Inactive'}</span>
                  </TableCell>
                  <TableCell>
                    <Button variant={'outline'} onClick={() => console.log('TODO change status')}>
                      Edit
                    </Button>
                    <Button
                      variant={dca.active ? 'destructive' : 'default'}
                      onClick={() => console.log('TODO change status')}
                    >
                      {dca.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
