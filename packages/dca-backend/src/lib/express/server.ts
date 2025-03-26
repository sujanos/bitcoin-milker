import express from 'express';

import { registerRoutes } from './routes';

const app = express();

registerRoutes(app);

export { app };
