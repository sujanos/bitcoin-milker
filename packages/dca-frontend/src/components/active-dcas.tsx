import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Pause, Play } from 'lucide-react';

import { useBackend, DCA } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
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
import { DialogueEditDCA } from '@/components/dialogue-edit-dca';
import { FREQUENCIES } from '@/components/select-frequency';

export const ActiveDcas: React.FC = () => {
  const [activeDCAs, setActiveDCAs] = useState<DCA[]>([]);
  const { deleteDCA, disableDCA, enableDCA, getDCAs } = useBackend();

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

  const handleDisableDCA = useCallback(
    async (dcaId: string) => {
      try {
        await disableDCA(dcaId);

        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === dcaId);
        updatedDCAs[index].active = false;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, disableDCA, setActiveDCAs]
  );

  const handleEnableDCA = useCallback(
    async (dcaId: string) => {
      try {
        await enableDCA(dcaId);

        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === dcaId);
        updatedDCAs[index].active = true;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, enableDCA, setActiveDCAs]
  );

  const handleUpdatedDCA = useCallback(
    async (updatedDCA: DCA) => {
      try {
        const updatedDCAs = [...activeDCAs];
        const index = updatedDCAs.findIndex((dca) => dca._id === updatedDCA._id);
        updatedDCAs[index] = updatedDCA;
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, setActiveDCAs]
  );

  const handleDeleteDCA = useCallback(
    async (dcaId: string) => {
      try {
        await deleteDCA(dcaId);

        const updatedDCAs = [...activeDCAs.filter((dca) => dca._id !== dcaId)];
        setActiveDCAs(updatedDCAs);
      } catch (error) {
        console.error('Error disabling DCA:', error);
      }
    },
    [activeDCAs, deleteDCA, setActiveDCAs]
  );

  if (!activeDCAs.length) {
    // TODO add a loading indicator while fetching, then show table even if empty
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {activeDCAs.map((dca) => {
              const uniqueKey = dca._id;

              return (
                <TableRow key={uniqueKey}>
                  <TableCell>${dca.purchaseAmount}</TableCell>
                  <TableCell>
                    {FREQUENCIES.find((freq) => freq.value === dca.purchaseIntervalHuman)?.label ||
                      dca.purchaseIntervalHuman}
                  </TableCell>
                  <TableCell>{new Date(dca.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <span>{dca.active ? 'Active' : 'Inactive'}</span>
                  </TableCell>
                  <TableCell>
                    <Box className="flex flex-row items-center justify-end gap-2 p-1">
                      <DialogueEditDCA dca={dca} onUpdate={handleUpdatedDCA} />
                      {dca.active ? (
                        <Button variant="destructive" onClick={() => handleDisableDCA(dca._id)}>
                          <Pause />
                        </Button>
                      ) : (
                        <Button variant="default" onClick={() => handleEnableDCA(dca._id)}>
                          <Play />
                        </Button>
                      )}
                      <Button variant="destructive" onClick={() => handleDeleteDCA(dca._id)}>
                        <Delete />
                      </Button>
                    </Box>
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
