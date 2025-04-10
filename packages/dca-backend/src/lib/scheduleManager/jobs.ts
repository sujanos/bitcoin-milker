import { Job } from '@whisthub/agenda';
import { Types } from 'mongoose';

import { getAgenda } from '../schedules/agendaClient';

interface JobParams {
  mustExist?: boolean;
  scheduleId: Types.ObjectId;
}

export const findJob = async ({ mustExist, scheduleId }: JobParams) => {
  const agendaClient = getAgenda();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [job] = await agendaClient.jobs({ 'data.scheduleId': scheduleId });

  if (mustExist && !job) {
    throw new Error(`No DCA schedule found with ID ${scheduleId}`);
  }

  return job;
};

export const disableJob = async ({ scheduleId }: Pick<JobParams, 'scheduleId'>) => {
  // Idempotent; if a job we're trying to disable doesn't exist, it is disabled.
  const job = await findJob({ scheduleId, mustExist: false });

  if (!job) return null;

  job.disable();
  return job.save();
};

export const enableJob = async ({ scheduleId }: Pick<JobParams, 'scheduleId'>) => {
  const job = await findJob({ scheduleId, mustExist: true });

  job.enable();
  return job.save();
};

export const cancelJob = async ({ scheduleId }: Pick<JobParams, 'scheduleId'>) => {
  const agendaClient = getAgenda();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return agendaClient.cancel({ 'data.scheduleId': new Types.ObjectId(scheduleId) });
};

/**
 * Schedules a job to run
 *
 * @param name Name of the job
 * @param data Data to pass to the job, can include scheduleId for uniqueness
 * @param options Scheduling options
 * @returns The scheduled job
 */
export async function scheduleJob<
  T extends { scheduleId: Types.ObjectId; vincentAppVersion: number },
>(
  name: string,
  data: T,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
): Promise<Job> {
  const agenda = getAgenda();

  // Create a new job instance
  const job = agenda.create<T>(name, data);

  // Set job uniqueness if scheduleId is provided
  if ('scheduleId' in data) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    job.unique({ 'data.scheduleId': data.scheduleId });
  }

  // Schedule the job based on provided options
  if (options.interval) {
    // Use 'every' for interval-based scheduling
    job.repeatEvery(options.interval);
  } else if (options.schedule) {
    // Use 'schedule' for one-time or cron-based scheduling
    job.schedule(options.schedule);
  }

  // Save the job to persist it
  await job.save();

  return job;
}
