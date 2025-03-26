import Agenda, { DefineOptions, Job, JobAttributesData } from 'agenda';
import consola from 'consola';

import { env } from '../env';

const { MONGODB_URI } = env;

const agendaLogger = consola.withTag('agenda');

const defaultConfig = {
  db: {
    address: MONGODB_URI,
    collection: 'agendaJobs',
  },
  defaultConcurrency: 1,
  defaultLockLifetime: 2 * 60 * 1000, // 2 minutes default lock time
  defaultLockLimit: 1,
  maxConcurrency: 1,
  processInterval: '10 seconds',
};

let agendaInstance: Agenda | null = null;

/**
 * Creates and configures an Agenda instance
 *
 * @param config Configuration options for Agenda
 * @returns Configured Agenda instance
 */
export async function createAgenda(config?: typeof defaultConfig): Promise<Agenda> {
  if (agendaInstance) {
    agendaLogger.warn('Agenda instance already exists. Returning existing instance.');
    return agendaInstance;
  }

  const mergedConfig = { ...defaultConfig, ...config };

  // Create new agenda instance
  const agenda = new Agenda({
    db: {
      address: mergedConfig.db.address,
      collection: mergedConfig.db.collection,
    },
    defaultConcurrency: mergedConfig.defaultConcurrency,
    defaultLockLifetime: mergedConfig.defaultLockLifetime,
    defaultLockLimit: mergedConfig.defaultLockLimit,
    lockLimit: mergedConfig.defaultLockLimit,
    maxConcurrency: mergedConfig.maxConcurrency,
    processEvery: mergedConfig.processInterval,
  });

  agendaInstance = agenda;

  // Start agenda
  agendaLogger.info('Starting agenda job processor...');
  await agenda.start();
  agendaLogger.info('Agenda job processor started');

  // Set up graceful shutdown
  process.on('SIGTERM', async () => {
    agendaLogger.info('Shutting down agenda...');
    await agenda.stop();
    agendaLogger.info('Agenda shut down successfully');
  });

  return agenda;
}

/**
 * Returns the existing Agenda instance or throws if it hasn't been created
 *
 * @returns The current Agenda instance
 */
export function getAgenda(): Agenda {
  if (!agendaInstance) {
    throw new Error('Agenda has not been initialized. Call createAgenda() first.');
  }
  return agendaInstance;
}

/**
 * Defines a job with the given name and handler function
 *
 * @param name Name of the job
 * @param options Job options
 * @param handler Function that executes the job
 */
export function defineJob(
  name: string,
  handler: (job: Job) => Promise<void>,
  options: DefineOptions = {}
): void {
  const agenda = getAgenda();
  agenda.define(name, options, handler);
  agendaLogger.debug(`Job "${name}" defined`);
}

/**
 * Schedules a job to run
 *
 * @param name Name of the job
 * @param data Data to pass to the job
 * @param options Scheduling options
 * @returns The scheduled job
 */
export async function scheduleJob<T extends JobAttributesData>(
  name: string,
  data: T,
  options: {
    interval?: string;
    priority?: string;
    repeatAt?: string;
    schedule?: string;
  } = {}
): Promise<Job> {
  const agenda = getAgenda();
  let job: Job;

  if (options.interval) {
    job = await agenda.every<T>(options.interval, name, data);
  } else if (options.repeatAt) {
    job = await agenda.every(options.repeatAt, name, data);
  } else if (options.schedule) {
    job = await agenda.schedule(options.schedule, name, data);
  } else {
    job = await agenda.now(name, data);
  }

  if (options.priority) {
    job.priority(options.priority);
  }

  await job.save();
  agendaLogger.debug(`Job "${name}" scheduled`);

  return job;
}

/**
 * Cancels jobs matching the given query
 *
 * @param query Query to match jobs for cancellation
 */
export async function cancelJobs(query: any): Promise<number | undefined> {
  const agenda = getAgenda();
  const result = await agenda.cancel(query);

  agendaLogger.debug(`Cancelled ${result} jobs matching query`);
  return result;
}
