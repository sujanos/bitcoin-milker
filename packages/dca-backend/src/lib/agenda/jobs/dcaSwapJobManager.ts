import consola from 'consola';
import { Types } from 'mongoose';

import * as executeDCASwapJobDef from './executeDCASwap';
import { getAgenda } from '../agendaClient';

interface FindSpecificScheduledJobParams {
  mustExist?: boolean;
  scheduleId: string;
}

const logger = consola.withTag('executeDCASwapJobManager');

export async function listJobsByWalletAddress({ walletAddress }: { walletAddress: string }) {
  const agendaClient = getAgenda();

  return (await agendaClient.jobs({
    data: {
      walletAddress,
    },
  })) as executeDCASwapJobDef.JobType[];
}

export async function findJob(params: {
  mustExist: true;
  scheduleId: string;
}): Promise<executeDCASwapJobDef.JobType>;
export async function findJob(params: {
  mustExist?: false;
  scheduleId: string;
}): Promise<executeDCASwapJobDef.JobType | undefined>;
export async function findJob({
  mustExist,
  scheduleId,
}: FindSpecificScheduledJobParams): Promise<executeDCASwapJobDef.JobType | undefined> {
  const agendaClient = getAgenda();

  const jobs = (await agendaClient.jobs({
    _id: new Types.ObjectId(scheduleId),
  })) as executeDCASwapJobDef.JobType[];

  if (mustExist && !jobs.length) {
    throw new Error(`No DCA schedule found with ID ${scheduleId}`);
  }

  return jobs[0];
}

export async function editJob({
  data,
  scheduleId,
}: {
  data: executeDCASwapJobDef.JobParams;
  scheduleId: string;
}) {
  const job = await findJob({ scheduleId, mustExist: true });
  const { purchaseIntervalHuman } = data;

  if (purchaseIntervalHuman !== job.attrs.data.purchaseIntervalHuman) {
    logger.log(
      `Changing DCA interval from ${job.attrs.data.purchaseIntervalHuman} to ${purchaseIntervalHuman}`
    );

    job.repeatEvery(purchaseIntervalHuman);
  }

  job.attrs.data = { ...data, vincentAppVersion: 11 };

  return (await job.save()) as unknown as executeDCASwapJobDef.JobType;
}

export async function disableJob({ scheduleId }: FindSpecificScheduledJobParams) {
  // Idempotent; if a job we're trying to disable doesn't exist, it is disabled.
  const job = await findJob({ scheduleId, mustExist: false });

  if (!job) return null;

  logger.log(`Disabling DCA job ${scheduleId}`);
  job.disable();
  return job.save();
}

export async function enableJob({
  scheduleId,
}: Pick<FindSpecificScheduledJobParams, 'scheduleId'>) {
  const job = await findJob({ scheduleId, mustExist: true });

  logger.log(`Enabling DCA job ${scheduleId}`);
  job.enable();
  return job.save();
}

export async function cancelJob({
  scheduleId,
}: Pick<FindSpecificScheduledJobParams, 'scheduleId'>) {
  const agendaClient = getAgenda();
  return agendaClient.cancel({ _id: new Types.ObjectId(scheduleId) });
}

export async function createJob(
  data: executeDCASwapJobDef.JobParams,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
) {
  const agenda = getAgenda();

  // Create a new job instance
  const job = agenda.create<executeDCASwapJobDef.JobParams>(executeDCASwapJobDef.jobName, data);

  // Currently we only allow a single DCA per walletAddress
  // eslint-disable-next-line @typescript-eslint/naming-convention
  job.unique({ 'data.walletAddress': data.walletAddress });

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
