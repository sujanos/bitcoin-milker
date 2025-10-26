import consola from 'consola';
import { Types } from 'mongoose';

import * as executeDCASwapJobDef from './executeDCASwap';
import { getAgenda } from '../agendaClient';

interface FindSpecificScheduledJobParams {
  ethAddress: string;
  mustExist?: boolean;
  scheduleId: string;
}

const logger = consola.withTag('executeDCASwapJobManager');

export async function listJobsByEthAddress({ ethAddress }: { ethAddress: string }) {
  const agendaClient = getAgenda();
  logger.log('listing jobs', { ethAddress });

  return (await agendaClient.jobs({
    'data.pkpInfo.ethAddress': ethAddress,
  })) as executeDCASwapJobDef.JobType[];
}

export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<executeDCASwapJobDef.JobType>;
export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<executeDCASwapJobDef.JobType | undefined>;
export async function findJob({
  ethAddress,
  mustExist,
  scheduleId,
}: FindSpecificScheduledJobParams): Promise<executeDCASwapJobDef.JobType | undefined> {
  const agendaClient = getAgenda();

  const jobs = (await agendaClient.jobs({
    _id: new Types.ObjectId(scheduleId),
    'data.pkpInfo.ethAddress': ethAddress,
  })) as executeDCASwapJobDef.JobType[];

  logger.log(`Found ${jobs.length} jobs with ID ${scheduleId}`);
  if (mustExist && !jobs.length) {
    throw new Error(`No DCA schedule found with ID ${scheduleId}`);
  }

  return jobs[0];
}

export async function editJob({
  data,
  scheduleId,
}: {
  data: Omit<executeDCASwapJobDef.JobParams, 'updatedAt'>;
  scheduleId: string;
}) {
  const {
    pkpInfo: { ethAddress },
  } = data;
  const job = await findJob({ ethAddress, scheduleId, mustExist: true });
  const { purchaseIntervalHuman } = data;

  if (purchaseIntervalHuman !== job.attrs.data.purchaseIntervalHuman) {
    logger.log(
      `Changing DCA interval from ${job.attrs.data.purchaseIntervalHuman} to ${purchaseIntervalHuman}`
    );

    job.repeatEvery(purchaseIntervalHuman);
  }

  job.attrs.data = { ...data, updatedAt: new Date() };

  return (await job.save()) as unknown as executeDCASwapJobDef.JobType;
}

export async function disableJob({
  ethAddress,
  scheduleId,
}: Omit<FindSpecificScheduledJobParams, 'mustExist'>) {
  // Idempotent; if a job we're trying to disable doesn't exist, it is disabled.
  const job = await findJob({ ethAddress, scheduleId, mustExist: false });

  if (!job) return null;

  logger.log(`Disabling DCA job ${scheduleId}`);
  job.disable();
  job.attrs.data.updatedAt = new Date();
  return job.save();
}

export async function enableJob({
  ethAddress,
  scheduleId,
}: Omit<FindSpecificScheduledJobParams, 'mustExist'>) {
  const job = await findJob({ ethAddress, scheduleId, mustExist: true });

  logger.log(`Enabling DCA job ${scheduleId}`);
  job.attrs.data.updatedAt = new Date();
  job.enable();
  return job.save();
}

export async function cancelJob({
  ethAddress,
  scheduleId,
}: Omit<FindSpecificScheduledJobParams, 'mustExist'>) {
  const agendaClient = getAgenda();
  logger.log(`Cancelling (deleting) DCA job ${scheduleId}`);
  return agendaClient.cancel({
    _id: new Types.ObjectId(scheduleId),
    'data.pkpInfo.ethAddress': ethAddress,
  });
}

export async function createJob(
  data: Omit<executeDCASwapJobDef.JobParams, 'updatedAt'>,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
) {
  const agenda = getAgenda();

  // Create a new job instance
  const job = agenda.create<executeDCASwapJobDef.JobParams>(executeDCASwapJobDef.jobName, {
    ...data,
    updatedAt: new Date(),
  });

  // Currently we only allow a single DCA per pkp
  job.unique({ 'data.pkpInfo.ethAddress': data.pkpInfo.ethAddress });

  // Schedule the job based on provided options
  if (options.interval) {
    // Use 'every' for interval-based scheduling
    logger.log('Setting interval to', options.interval);
    job.repeatEvery(options.interval);
  } else if (options.schedule) {
    // Use 'schedule' for one-time or cron-based scheduling
    job.schedule(options.schedule);
  }

  // Save the job to persist it
  await job.save();
  logger.log(`Created DCA job ${job.attrs._id}`);

  return job;
}
