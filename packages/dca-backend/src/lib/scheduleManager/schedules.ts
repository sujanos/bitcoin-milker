import consola from 'consola';
import { Types } from 'mongoose';

import { Schedule } from '../mongo/models/Schedule';
import { getAgenda } from '../schedules/agendaClient';
import { executeSwap } from '../schedules/jobs';
import { CreateScheduleParams, DeleteScheduleParams, EditScheduleParams } from '../types';
import { cancelJob, findJob, scheduleJob } from './jobs';

const logger = consola.withTag('ScheduleManager');

export const listSchedules = async (params: { walletAddress: string }) => {
  const { walletAddress } = params;

  const schedules = await Schedule.find({ walletAddress }).lean();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  return Promise.all(
    schedules.map(async (schedule) => {
      const job = await findJob({ scheduleId: schedule._id });
      return {
        ...schedule,
        active: !job.attrs.disabled,
        failedAt: job.attrs.failedAt,
        failedReason: job.attrs.failReason,
        lastFinishedAt: job.attrs.lastFinishedAt,
        lastRunAt: job.attrs.lastRunAt,
        nextRunAt: job.attrs.nextRunAt,
      };
    })
  );
};
export const createSchedule = async (params: CreateScheduleParams) => {
  const agenda = getAgenda();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const numCancelled = await agenda.cancel({ 'data.walletAddress': params.walletAddress });

  logger.log(`Removed ${numCancelled} cancelled jobs for wallet ${params.walletAddress}`);

  // Delete ALL existing schedules for this wallet address
  const deleteResult = await Schedule.deleteMany({
    walletAddress: params.walletAddress,
  });

  if (deleteResult.deletedCount > 0) {
    logger.info(
      `Deleted ${deleteResult.deletedCount} existing DCA schedule(s) for wallet ${params.walletAddress}`
    );
  }

  // Create a new schedule record
  const schedule = new Schedule({
    ...params,
  });

  await schedule.save();

  const { name, purchaseIntervalHuman: interval } = params;

  // Ensure there's an associated agenda job
  const job = await scheduleJob<{
    name: string;
    scheduleId: Types.ObjectId;
    walletAddress: string;
  }>(
    executeSwap.jobName,
    { name, scheduleId: schedule._id, walletAddress: params.walletAddress },
    { interval }
  );

  return { job, schedule };
};
export const editSchedule = async (params: EditScheduleParams) => {
  const agenda = getAgenda();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const numCancelled = await agenda.cancel({ 'data.scheduleId': params.scheduleId });

  logger.log(`Removed ${numCancelled} cancelled jobs for wallet ${params.walletAddress}`);

  // Update existing schedule for this wallet address
  const updatedSchedule = await Schedule.findByIdAndUpdate(
    params.scheduleId,
    {
      name: params.name,
      purchaseAmount: params.purchaseAmount,
      purchaseIntervalHuman: params.purchaseIntervalHuman,
      walletAddress: params.walletAddress,
    },
    {
      new: true, // return the updated document instead of the found one
    }
  );

  if (!updatedSchedule) {
    throw new Error(`Could not find schedule with id ${params.scheduleId}`);
  }

  const { name, purchaseIntervalHuman: interval } = params;

  // Ensure there's an associated agenda job
  const job = await scheduleJob<{
    name: string;
    scheduleId: Types.ObjectId;
    walletAddress: string;
  }>(
    executeSwap.jobName,
    { name, scheduleId: updatedSchedule._id, walletAddress: params.walletAddress },
    { interval }
  );

  return {
    schedule: {
      ...updatedSchedule,
      active: !job.attrs.disabled,
      failedAt: job.attrs.failedAt,
      failedReason: job.attrs.failReason,
      lastFinishedAt: job.attrs.lastFinishedAt,
      lastRunAt: job.attrs.lastRunAt,
      nextRunAt: job.attrs.nextRunAt,
    },
  };
};

export const deleteSchedule = async (params: DeleteScheduleParams) => {
  logger.info('Cancelling job for schedule', params.scheduleId, '...');
  const numJobsCancelled = await cancelJob(params);

  logger.info(`Cancelled ${numJobsCancelled} jobs; destroying Schedule`, params.scheduleId, '...');

  const { deletedCount: numSchedulesDeleted } = await Schedule.deleteOne({
    _id: params.scheduleId,
  });

  logger.info(`Destroyed ${numSchedulesDeleted} Schedules`);
};
