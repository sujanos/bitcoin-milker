import { Response } from 'express';
import { Types } from 'mongoose';

import { disableJob, enableJob } from '../../scheduleManager/jobs';
import {
  createSchedule,
  deleteSchedule,
  editSchedule,
  listSchedules,
} from '../../scheduleManager/schedules';
import { CreateScheduleParams, EditScheduleParams } from '../../types';

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-sdk';

export const handleListSchedulesRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    const schedules = await listSchedules({ walletAddress });

    res.json({ data: schedules, success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleCreateScheduleRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    const scheduleData = { ...req.body, walletAddress } as CreateScheduleParams;

    const { schedule } = await createSchedule(scheduleData);
    res.status(201).json({ data: schedule, success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleEditScheduleRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;
    const { scheduleId } = req.params as { scheduleId: string };

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    const scheduleData = { ...req.body, scheduleId, walletAddress } as EditScheduleParams;

    const { schedule } = await editSchedule(scheduleData);
    res.status(201).json({ data: schedule, success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleDisableScheduleRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;
    const { scheduleId } = req.params as { scheduleId: string };

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    const job = await disableJob({ scheduleId: new Types.ObjectId(scheduleId) });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ data: job.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleEnableScheduleRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;
    const { scheduleId } = req.params as { scheduleId: string };

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    const job = await enableJob({ scheduleId: new Types.ObjectId(scheduleId) });

    res.json({ data: job.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleDeleteScheduleRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  try {
    const walletAddress = req.user.pkpAddress;
    const { scheduleId } = req.params as { scheduleId: string };

    if (!walletAddress) {
      res.status(400).json({ error: 'No wallet address provided' });
      return;
    }

    await deleteSchedule({ scheduleId: new Types.ObjectId(scheduleId) });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
