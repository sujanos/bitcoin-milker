import { env } from '../lib/env';
import { app } from '../lib/express/server';
import { serviceLogger } from '../lib/logger';
import { connectToMongoDB } from '../lib/mongo/mongoose'; // Adjust path if needed

const { MONGODB_URI, PORT } = env;

// Connect to MongoDB then start the server
connectToMongoDB(MONGODB_URI)
  .then(() => {
    serviceLogger.info('Starting server...');

    return app.listen(PORT, () => {
      serviceLogger.info(`Server is listening on port ${PORT}`);
    });
  })
  .catch((error: unknown) => {
    serviceLogger.error('!!! Failed to initialize service', error);
    throw error;
  });
