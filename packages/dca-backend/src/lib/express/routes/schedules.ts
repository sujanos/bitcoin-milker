import consola from 'consola';
import { Request, Response } from 'express';

import { Schedule } from '../../mongo/models/Schedule';

export const getSchedules = async (req: Request, res: Response) => {
  const walletAddress = req.user?.pkp.address;
  if (!walletAddress) {
    res.status(400).json({ error: 'No wallet address provided' });
    return;
  }

  const schedules = await Schedule.find({ walletAddress }).lean();

  if (!schedules || schedules.length === 0) {
    res.status(404).json({
      error: `No DCA schedules found for wallet address ${walletAddress}`,
    });
  }

  res.json({ data: schedules, success: true });
};

export const createSchedule = async (req: Request, res: Response) => {
  const walletAddress = req.user?.pkp.address;
  if (!walletAddress) {
    res.status(400).json({ error: 'No wallet address provided' });
    return;
  }

  const scheduleData = req.body as {
    purchaseAmount: string;
    purchaseIntervalHuman: number;
  };

  // Delete ALL existing schedules for this wallet address
  const deleteResult = await Schedule.deleteMany({ walletAddress });

  if (deleteResult.deletedCount > 0) {
    consola.info(
      `Deleted ${deleteResult.deletedCount} existing DCA schedule(s) for wallet ${walletAddress}`
    );
  }

  // Create a new schedule
  const schedule = new Schedule({
    ...scheduleData,
    walletAddress,
  });

  await schedule.save();
  res.status(201).json({ data: schedule, success: true });
};

export const disableSchedule = async (req: Request, res: Response) => {
  const { scheduleId: _id } = req.params as { scheduleId: string };

  const result = await Schedule.findOneAndUpdate(
    { _id },
    { active: false },
    {
      new: true,
    }
  );

  if (!result) {
    res.status(404).json({
      error: `No DCA schedule found with ID ${_id}`,
    });
  }

  res.json({ data: result, success: true });
};

export const enableSchedule = async (req: Request, res: Response) => {
  const { scheduleId: _id } = req.params as { scheduleId: string };

  const result = await Schedule.findOneAndUpdate(
    { _id },
    { active: true },
    {
      new: true,
    }
  );

  if (!result) {
    res.status(404).json({
      error: `No DCA schedule found with ID ${_id}`,
    });
  }

  res.json({ data: result, success: true });
};
