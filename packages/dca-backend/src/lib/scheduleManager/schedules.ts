import consola from 'consola';
import { Types } from 'mongoose';

import { Schedule } from '../mongo/models/Schedule';
import { getAgenda } from '../schedules/agendaClient';
import { executeSwap } from '../schedules/jobs';
import { CreateScheduleParams, DeleteScheduleParams } from '../types';
import { cancelJob, findJob, scheduleJob } from './jobs';

const logger = consola.withTag('ScheduleManager');

export const listSchedules = async (params: { walletAddress: string }) => {
  const { walletAddress } = params;

  const schedules = await Schedule.find({ walletAddress }).lean();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  return Promise.all(
    schedules.map(async (schedule) => {
      const job = await findJob({ scheduleId: schedule._id });
      return { ...schedule, active: !job.attrs.disabled };
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

export const deleteSchedule = async (params: DeleteScheduleParams) => {
  logger.info('Cancelling job for schedule', params.scheduleId, '...');
  const numJobsCancelled = await cancelJob(params);

  logger.info(`Cancelled ${numJobsCancelled} jobs; destroying Schedule`, params.scheduleId, '...');

  const { deletedCount: numSchedulesDeleted } = await Schedule.deleteOne({
    _id: params.scheduleId,
  });

  logger.info(`Destroyed ${numSchedulesDeleted} Schedules`);
};
