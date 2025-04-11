import { Job } from '@whisthub/agenda';

import { createAgenda, getAgenda } from './agenda/agendaClient';
import { executeDCASwapJobDef } from './agenda/jobs';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define(executeDCASwapJobDef.jobName, async (job: Job<executeDCASwapJobDef.JobType>) => {
    // TODO: add job-aware logic such as cool-downs in case of repeated failures here

    await executeDCASwapJobDef.processJob(job);
  });

  return agenda;
}
