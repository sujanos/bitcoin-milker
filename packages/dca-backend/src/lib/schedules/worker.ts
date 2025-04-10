import { Job } from '@whisthub/agenda';

import { createAgenda, getAgenda } from './agendaClient';
import { executeSwap } from './jobs';
import { ExecuteDCASwapJobParams } from './jobs/execute-swap/executeDCASwapJob';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define(executeSwap.jobName, async (job: Job<ExecuteDCASwapJobParams>) => {
    const {
      attrs: {
        data: { scheduleId, vincentAppVersion },
      },
    } = job;

    // TODO: add job-aware logic such as cool-downs in case of repeated failures here

    await executeSwap.processJob({
      scheduleId,
      vincentAppVersion,
    });
  });

  return agenda;
}
