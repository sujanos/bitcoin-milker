import { env } from '../lib/env';
import { app } from '../lib/express/server';
import { serviceLogger } from '../lib/logger';
import { connectToMongoDB } from '../lib/mongo/mongoose';
// import { createAgenda } from '../lib/schedules/agendaClient'; // Adjust path if needed
import { startWorker } from '../lib/schedules/worker';

const { MONGODB_URI, PORT } = env;

// Connect to MongoDB then start the server
connectToMongoDB(MONGODB_URI)
  .then(async () => {
    serviceLogger.info('Starting server...');

    app.listen(PORT, () => {
      serviceLogger.info(`Server is listening on port ${PORT}`);
    });

    await startWorker();
    // await createAgenda();
    serviceLogger.info('Agenda is ready');
  })
  .catch((error: unknown) => {
    serviceLogger.error('!!! Failed to initialize service', error);
    throw error;
  });
