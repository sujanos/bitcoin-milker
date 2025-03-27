import { Job } from '@whisthub/agenda';

import { createAgenda, getAgenda } from './agendaClient';
import { executeSwap } from './jobs';
import { ExecuteSwapParams } from './jobs/execute-swap/execute-swap';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define(executeSwap.jobName, async (job: Job<ExecuteSwapParams>) => {
    const {
      attrs: {
        data: { scheduleId },
      },
    } = job;

    await executeSwap.processJob({
      scheduleId,
    });
  });

  return agenda;
}
