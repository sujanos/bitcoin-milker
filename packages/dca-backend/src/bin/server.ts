import mongoose from 'mongoose';

import { env } from '../lib/env';
import { expressLogger } from '../lib/express/logger';
import { app } from '../lib/express/server';

const { MONGODB_URI, PORT } = env;

expressLogger.info('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI).then(() => {
  expressLogger.info('Connected to MongoDB; starting server...');

  app.listen(PORT, () => {
    expressLogger.info(`Server is listening on port ${PORT}`);
  });
});
